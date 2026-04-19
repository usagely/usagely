package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	orgID = "00000000-0000-0000-0000-000000000001"

	teamEngID   = "00000000-0000-0000-0000-000000000011"
	teamProdID  = "00000000-0000-0000-0000-000000000012"
	teamDataID  = "00000000-0000-0000-0000-000000000013"
	teamMktID   = "00000000-0000-0000-0000-000000000014"
	teamCsID    = "00000000-0000-0000-0000-000000000015"
	teamSalesID = "00000000-0000-0000-0000-000000000016"
	teamHrID    = "00000000-0000-0000-0000-000000000017"
	teamFinID   = "00000000-0000-0000-0000-000000000018"
)

type Team struct {
	ID      string
	Name    string
	Members int
}

type Tool struct {
	Name         string
	Vendor       string
	Category     string
	Status       string
	Seats        *int
	Spend        float64
	Prev         float64
	Provisioning string
}

type Model struct {
	Name       string
	Vendor     string
	TokensIn   int64
	TokensOut  int64
	Calls      int64
	Cost       float64
	AvgLatency float64
}

type User struct {
	Name    string
	Email   string
	Team    string
	Role    string
	Tokens  int64
	Cost    float64
	PRs     int
	TopTool string
}

type Budget struct {
	Scope  string
	Period string
	Limit  float64
	Used   float64
	Alert  int
}

type Anomaly struct {
	Title    string
	Body     string
	Severity string
	Team     string
	Owner    string
}

type Recommendation struct {
	Title      string
	Savings    float64
	Confidence float64
	Reason     string
	Scope      string
	Effort     string
}

type Approval struct {
	Requester string
	Tool      string
	Reason    string
	CostEst   float64
	Status    string
}

type ShadowTool struct {
	Name      string
	Users     int
	Source    string
	FirstSeen string
	Monthly   float64
	Risk      string
}

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		fmt.Println("DATABASE_URL not set, skipping seed")
		os.Exit(0)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	if err := seed(ctx, pool); err != nil {
		log.Fatalf("Seed failed: %v", err)
	}

	fmt.Println("Seed completed successfully")
}

func seed(ctx context.Context, pool *pgxpool.Pool) error {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	if err := seedOrganization(ctx, tx); err != nil {
		return fmt.Errorf("seed organization: %w", err)
	}

	if err := seedTeams(ctx, tx); err != nil {
		return fmt.Errorf("seed teams: %w", err)
	}

	if err := seedUsers(ctx, tx); err != nil {
		return fmt.Errorf("seed users: %w", err)
	}

	if err := seedTools(ctx, tx); err != nil {
		return fmt.Errorf("seed tools: %w", err)
	}

	if err := seedModels(ctx, tx); err != nil {
		return fmt.Errorf("seed models: %w", err)
	}

	if err := seedUsageDaily(ctx, tx); err != nil {
		return fmt.Errorf("seed usage_daily: %w", err)
	}

	if err := seedUserUsage(ctx, tx); err != nil {
		return fmt.Errorf("seed user_usage: %w", err)
	}

	if err := seedModelUsage(ctx, tx); err != nil {
		return fmt.Errorf("seed model_usage: %w", err)
	}

	if err := seedBudgets(ctx, tx); err != nil {
		return fmt.Errorf("seed budgets: %w", err)
	}

	if err := seedAnomalies(ctx, tx); err != nil {
		return fmt.Errorf("seed anomalies: %w", err)
	}

	if err := seedRecommendations(ctx, tx); err != nil {
		return fmt.Errorf("seed recommendations: %w", err)
	}

	if err := seedApprovals(ctx, tx); err != nil {
		return fmt.Errorf("seed approvals: %w", err)
	}

	if err := seedShadowTools(ctx, tx); err != nil {
		return fmt.Errorf("seed shadow_tools: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit transaction: %w", err)
	}

	return nil
}

func seedOrganization(ctx context.Context, tx pgx.Tx) error {
	query := `
		INSERT INTO organizations (id, name, slug, edition, created_at)
		VALUES ($1, $2, $3, $4, NOW())
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name,
			slug = EXCLUDED.slug,
			edition = EXCLUDED.edition
	`
	_, err := tx.Exec(ctx, query, orgID, "Acme Co", "acme-co", "oss")
	return err
}

func seedTeams(ctx context.Context, tx pgx.Tx) error {
	teams := []Team{
		{teamEngID, "Engineering", 48},
		{teamProdID, "Product", 22},
		{teamDataID, "Data & ML", 19},
		{teamMktID, "Marketing", 14},
		{teamCsID, "Customer Support", 12},
		{teamSalesID, "Sales", 9},
		{teamHrID, "People Ops", 6},
		{teamFinID, "Finance", 5},
	}

	batch := &pgx.Batch{}
	for _, t := range teams {
		batch.Queue(
			`INSERT INTO teams (id, org_id, name, color, created_at)
			 VALUES ($1, $2, $3, $4, NOW())
			 ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
			t.ID, orgID, t.Name, "",
		)
	}

	results := tx.SendBatch(ctx, batch)
	defer results.Close()

	for range teams {
		if _, err := results.Exec(); err != nil {
			return err
		}
	}

	return nil
}

func seedUsers(ctx context.Context, tx pgx.Tx) error {
	users := []User{
		{"Clara Mendes", "clara@acme.co", "Engineering", "Senior Eng", 18_420_000, 1420, 34, "Claude Code"},
		{"Diego Ramos", "diego@acme.co", "Engineering", "Staff Eng", 22_100_000, 1980, 41, "Cursor"},
		{"Harper Lin", "harper@acme.co", "Data & ML", "ML Eng", 41_300_000, 2840, 18, "OpenAI API"},
		{"Noor Haddad", "noor@acme.co", "Product", "PM", 2_140_000, 182, 0, "ChatGPT Team"},
		{"Tomás Alvarez", "tomas@acme.co", "Data & ML", "Data Sci", 38_700_000, 2120, 6, "Anthropic API"},
		{"Priya Rao", "priya@acme.co", "Engineering", "Eng Mgr", 4_320_000, 310, 8, "Claude Teams"},
		{"Emre Yilmaz", "emre@acme.co", "Marketing", "Content Lead", 1_980_000, 148, 0, "Midjourney"},
		{"Brooke Yi", "brooke@acme.co", "Customer Support", "CS Lead", 3_420_000, 220, 0, "Claude Teams"},
		{"Samir Nouri", "samir@acme.co", "Engineering", "Eng", 14_820_000, 1140, 22, "Cursor"},
		{"Ines Cardoso", "ines@acme.co", "Product", "Design", 840_000, 62, 0, "ChatGPT Team"},
		{"Oren Adler", "oren@acme.co", "Sales", "AE", 1_230_000, 94, 0, "ChatGPT Team"},
		{"Riya Kapoor", "riya@acme.co", "Data & ML", "ML Eng", 29_400_000, 1820, 5, "Anthropic API"},
		{"Luca Ferretti", "luca@acme.co", "Engineering", "Eng", 11_300_000, 840, 19, "Claude Code"},
		{"Maya Okafor", "maya@acme.co", "Engineering", "Senior Eng", 16_900_000, 1280, 28, "Claude Code"},
	}

	teamMap := map[string]string{
		"Engineering":      teamEngID,
		"Product":          teamProdID,
		"Data & ML":        teamDataID,
		"Marketing":        teamMktID,
		"Customer Support": teamCsID,
		"Sales":            teamSalesID,
		"People Ops":       teamHrID,
		"Finance":          teamFinID,
	}

	batch := &pgx.Batch{}
	for _, u := range users {
		teamID := teamMap[u.Team]
		batch.Queue(
			`INSERT INTO users (id, org_id, team_id, name, email, role, created_at)
			 VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())
			 ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name`,
			orgID, teamID, u.Name, u.Email, u.Role,
		)
	}

	results := tx.SendBatch(ctx, batch)
	defer results.Close()

	for range users {
		if _, err := results.Exec(); err != nil {
			return err
		}
	}

	return nil
}

func seedTools(ctx context.Context, tx pgx.Tx) error {
	tools := []Tool{
		{"OpenAI API", "OpenAI", "LLM API", "approved", nil, 42310, 36120, "key"},
		{"Anthropic API", "Anthropic", "LLM API", "approved", nil, 38790, 28420, "key"},
		{"Google Vertex", "Google", "LLM API", "approved", nil, 9120, 8100, "key"},
		{"GitHub Copilot", "GitHub", "Coding", "approved", intPtr(42), 798, 760, "sso"},
		{"Cursor", "Cursor", "Coding", "approved", intPtr(38), 1520, 1140, "sso"},
		{"Claude Code", "Anthropic", "Coding", "approved", intPtr(30), 4200, 3100, "sso"},
		{"ChatGPT Team", "OpenAI", "Chat seat", "approved", intPtr(78), 2340, 2340, "sso"},
		{"Claude Teams", "Anthropic", "Chat seat", "approved", intPtr(65), 1950, 1680, "sso"},
		{"Midjourney", "Midjourney", "Image", "approved", intPtr(8), 256, 240, "manual"},
		{"Runway", "Runway", "Video", "approved", intPtr(4), 380, 360, "manual"},
		{"ElevenLabs", "ElevenLabs", "Voice", "approved", intPtr(6), 720, 580, "key"},
		{"Whisper API", "OpenAI", "Voice", "approved", nil, 340, 290, "key"},
		{"Perplexity", "Perplexity", "Chat seat", "shadow", intPtr(11), 220, 0, "detected"},
		{"v0", "Vercel", "Coding", "pending", intPtr(12), 0, 0, "request"},
		{"Suno", "Suno", "Audio", "shadow", intPtr(3), 60, 0, "detected"},
	}

	batch := &pgx.Batch{}
	for _, t := range tools {
		batch.Queue(
			`INSERT INTO tools (id, org_id, name, vendor, category, status, seats, provisioning, spend_current, spend_prev, created_at)
			 VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
			 ON CONFLICT (org_id, name) DO UPDATE SET
				vendor = EXCLUDED.vendor,
				category = EXCLUDED.category,
				status = EXCLUDED.status,
				seats = EXCLUDED.seats,
				provisioning = EXCLUDED.provisioning,
				spend_current = EXCLUDED.spend_current,
				spend_prev = EXCLUDED.spend_prev`,
			orgID, t.Name, t.Vendor, t.Category, t.Status, t.Seats, t.Provisioning, t.Spend, t.Prev,
		)
	}

	results := tx.SendBatch(ctx, batch)
	defer results.Close()

	for range tools {
		if _, err := results.Exec(); err != nil {
			return err
		}
	}

	return nil
}

func seedModels(ctx context.Context, tx pgx.Tx) error {
	models := []Model{
		{"claude-sonnet-4.5", "Anthropic", 128_400_000, 21_300_000, 412_330, 21800, 1.8},
		{"claude-opus-4", "Anthropic", 22_100_000, 5_400_000, 48_120, 12400, 2.9},
		{"gpt-4o", "OpenAI", 96_200_000, 14_800_000, 311_900, 18200, 1.5},
		{"gpt-4.1-mini", "OpenAI", 210_000_000, 28_600_000, 612_400, 14600, 0.9},
		{"o3", "OpenAI", 4_100_000, 1_800_000, 2_310, 6200, 8.1},
		{"gemini-2.5-pro", "Google", 58_000_000, 6_400_000, 71_200, 7300, 1.7},
		{"gemini-2.5-flash", "Google", 140_000_000, 12_000_000, 292_100, 1820, 0.6},
	}

	batch := &pgx.Batch{}
	for _, m := range models {
		batch.Queue(
			`INSERT INTO models (id, name, vendor, created_at)
			 VALUES (gen_random_uuid(), $1, $2, NOW())
			 ON CONFLICT (name) DO UPDATE SET vendor = EXCLUDED.vendor`,
			m.Name, m.Vendor,
		)
	}

	results := tx.SendBatch(ctx, batch)
	defer results.Close()

	for range models {
		if _, err := results.Exec(); err != nil {
			return err
		}
	}

	return nil
}

func seedUsageDaily(ctx context.Context, tx pgx.Tx) error {
	today := time.Date(2026, 4, 19, 0, 0, 0, 0, time.UTC)
	base := 2400.0

	batch := &pgx.Batch{}
	for i := 59; i >= 0; i-- {
		d := today.AddDate(0, 0, -i)
		weekday := d.Weekday()
		weekMult := 1.0
		if weekday == 0 || weekday == 6 {
			weekMult = 0.55
		}

		growth := 1.0 + float64(59-i)*0.008
		noise := 0.9 + 0.25*0.5
		val := base * weekMult * growth * noise

		if i == 4 {
			val *= 1.9
		}

		batch.Queue(
			`INSERT INTO usage_daily (id, org_id, date, total_value, created_at)
			 VALUES (gen_random_uuid(), $1, $2, $3, NOW())
			 ON CONFLICT (org_id, date) DO UPDATE SET total_value = EXCLUDED.total_value`,
			orgID, d.Format("2006-01-02"), int(val),
		)
	}

	results := tx.SendBatch(ctx, batch)
	defer results.Close()

	for i := 0; i < 60; i++ {
		if _, err := results.Exec(); err != nil {
			return err
		}
	}

	return nil
}

func seedUserUsage(ctx context.Context, tx pgx.Tx) error {
	users := []User{
		{"Clara Mendes", "clara@acme.co", "Engineering", "Senior Eng", 18_420_000, 1420, 34, "Claude Code"},
		{"Diego Ramos", "diego@acme.co", "Engineering", "Staff Eng", 22_100_000, 1980, 41, "Cursor"},
		{"Harper Lin", "harper@acme.co", "Data & ML", "ML Eng", 41_300_000, 2840, 18, "OpenAI API"},
		{"Noor Haddad", "noor@acme.co", "Product", "PM", 2_140_000, 182, 0, "ChatGPT Team"},
		{"Tomás Alvarez", "tomas@acme.co", "Data & ML", "Data Sci", 38_700_000, 2120, 6, "Anthropic API"},
		{"Priya Rao", "priya@acme.co", "Engineering", "Eng Mgr", 4_320_000, 310, 8, "Claude Teams"},
		{"Emre Yilmaz", "emre@acme.co", "Marketing", "Content Lead", 1_980_000, 148, 0, "Midjourney"},
		{"Brooke Yi", "brooke@acme.co", "Customer Support", "CS Lead", 3_420_000, 220, 0, "Claude Teams"},
		{"Samir Nouri", "samir@acme.co", "Engineering", "Eng", 14_820_000, 1140, 22, "Cursor"},
		{"Ines Cardoso", "ines@acme.co", "Product", "Design", 840_000, 62, 0, "ChatGPT Team"},
		{"Oren Adler", "oren@acme.co", "Sales", "AE", 1_230_000, 94, 0, "ChatGPT Team"},
		{"Riya Kapoor", "riya@acme.co", "Data & ML", "ML Eng", 29_400_000, 1820, 5, "Anthropic API"},
		{"Luca Ferretti", "luca@acme.co", "Engineering", "Eng", 11_300_000, 840, 19, "Claude Code"},
		{"Maya Okafor", "maya@acme.co", "Engineering", "Senior Eng", 16_900_000, 1280, 28, "Claude Code"},
	}

	periodStart := time.Date(2026, 4, 1, 0, 0, 0, 0, time.UTC)

	batch := &pgx.Batch{}
	for _, u := range users {
		batch.Queue(
			`INSERT INTO user_usage (id, user_id, period_start, tokens, cost_usd, prs_merged, top_tool, created_at)
			 SELECT gen_random_uuid(), id, $2, $3, $4, $5, $6, NOW()
			 FROM users WHERE email = $1
			 ON CONFLICT (user_id, period_start) DO UPDATE SET
				tokens = EXCLUDED.tokens,
				cost_usd = EXCLUDED.cost_usd,
				prs_merged = EXCLUDED.prs_merged,
				top_tool = EXCLUDED.top_tool`,
			u.Email, periodStart.Format("2006-01-02"), u.Tokens, u.Cost, u.PRs, u.TopTool,
		)
	}

	results := tx.SendBatch(ctx, batch)
	defer results.Close()

	for range users {
		if _, err := results.Exec(); err != nil {
			return err
		}
	}

	return nil
}

func seedModelUsage(ctx context.Context, tx pgx.Tx) error {
	models := []Model{
		{"claude-sonnet-4.5", "Anthropic", 128_400_000, 21_300_000, 412_330, 21800, 1.8},
		{"claude-opus-4", "Anthropic", 22_100_000, 5_400_000, 48_120, 12400, 2.9},
		{"gpt-4o", "OpenAI", 96_200_000, 14_800_000, 311_900, 18200, 1.5},
		{"gpt-4.1-mini", "OpenAI", 210_000_000, 28_600_000, 612_400, 14600, 0.9},
		{"o3", "OpenAI", 4_100_000, 1_800_000, 2_310, 6200, 8.1},
		{"gemini-2.5-pro", "Google", 58_000_000, 6_400_000, 71_200, 7300, 1.7},
		{"gemini-2.5-flash", "Google", 140_000_000, 12_000_000, 292_100, 1820, 0.6},
	}

	periodStart := time.Date(2026, 4, 1, 0, 0, 0, 0, time.UTC)

	batch := &pgx.Batch{}
	for _, m := range models {
		batch.Queue(
			`INSERT INTO model_usage (id, model_id, org_id, period_start, tokens_in, tokens_out, calls, cost_usd, avg_latency, created_at)
			 SELECT gen_random_uuid(), id, $2, $3, $4, $5, $6, $7, $8, NOW()
			 FROM models WHERE name = $1
			 ON CONFLICT (model_id, org_id, period_start) DO UPDATE SET
				tokens_in = EXCLUDED.tokens_in,
				tokens_out = EXCLUDED.tokens_out,
				calls = EXCLUDED.calls,
				cost_usd = EXCLUDED.cost_usd,
				avg_latency = EXCLUDED.avg_latency`,
			m.Name, orgID, periodStart.Format("2006-01-02"), m.TokensIn, m.TokensOut, m.Calls, m.Cost, m.AvgLatency,
		)
	}

	results := tx.SendBatch(ctx, batch)
	defer results.Close()

	for range models {
		if _, err := results.Exec(); err != nil {
			return err
		}
	}

	return nil
}

func seedBudgets(ctx context.Context, tx pgx.Tx) error {
	budgets := []Budget{
		{"Engineering", "Monthly", 32000, 28420, 85},
		{"Data & ML", "Monthly", 28000, 27100, 90},
		{"Product", "Monthly", 4000, 1870, 80},
		{"Marketing", "Monthly", 2000, 1240, 75},
		{"CS", "Monthly", 3500, 1380, 80},
		{"Company", "Quarterly", 320000, 218000, 80},
	}

	batch := &pgx.Batch{}
	for _, b := range budgets {
		batch.Queue(
			`INSERT INTO budgets (id, org_id, scope, period, limit_usd, used_usd, alert_pct, created_at, updated_at)
			 VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
			 ON CONFLICT (org_id, scope) DO UPDATE SET
				period = EXCLUDED.period,
				limit_usd = EXCLUDED.limit_usd,
				used_usd = EXCLUDED.used_usd,
				alert_pct = EXCLUDED.alert_pct`,
			orgID, b.Scope, b.Period, b.Limit, b.Used, b.Alert,
		)
	}

	results := tx.SendBatch(ctx, batch)
	defer results.Close()

	for range budgets {
		if _, err := results.Exec(); err != nil {
			return err
		}
	}

	return nil
}

func seedAnomalies(ctx context.Context, tx pgx.Tx) error {
	anomalies := []Anomaly{
		{
			"Anthropic API spend +187% vs 7-day avg",
			"Spike isolated to `prod-rag-indexer` service — possible loop.",
			"danger",
			"Engineering",
			"Clara Mendes",
		},
		{
			"Data & ML team at 97% of monthly budget",
			"11 days remaining in period. Projected $31.4k vs $28k limit.",
			"warn",
			"Data & ML",
			"Harper Lin",
		},
		{
			"Unapproved tool detected: Perplexity",
			"11 members expensed Perplexity Pro in last 30 days.",
			"warn",
			"Mixed",
			"",
		},
		{
			"o3 usage spike — 8.2k calls in 2h",
			"Ran on `eval-harness` by Tomás. $420 of o3 burn.",
			"danger",
			"Data & ML",
			"Tomás Alvarez",
		},
	}

	batch := &pgx.Batch{}
	for _, a := range anomalies {
		batch.Queue(
			`INSERT INTO anomalies (id, org_id, title, body, severity, team_name, owner_name, detected_at, created_at)
			 VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
			 ON CONFLICT (org_id, title) DO UPDATE SET
				body = EXCLUDED.body,
				severity = EXCLUDED.severity,
				team_name = EXCLUDED.team_name,
				owner_name = EXCLUDED.owner_name`,
			orgID, a.Title, a.Body, a.Severity, a.Team, a.Owner,
		)
	}

	results := tx.SendBatch(ctx, batch)
	defer results.Close()

	for range anomalies {
		if _, err := results.Exec(); err != nil {
			return err
		}
	}

	return nil
}

func seedRecommendations(ctx context.Context, tx pgx.Tx) error {
	recommendations := []Recommendation{
		{
			"Downgrade 64% of gpt-4o calls to gpt-4.1-mini",
			8120,
			0.82,
			"Low-complexity classification & extraction prompts; <1% quality loss on eval set.",
			"API · Engineering",
			"low",
		},
		{
			"Enable prompt caching on `rag-assistant`",
			4200,
			0.91,
			"38% of tokens repeat within 5m window. Cache-hit saves ~70% input cost.",
			"Anthropic · Data",
			"low",
		},
		{
			"Reclaim 14 inactive Copilot seats",
			266,
			0.98,
			"No completions accepted in last 30 days.",
			"GitHub Copilot",
			"low",
		},
		{
			"Consolidate Cursor + Copilot for 22 engineers",
			418,
			0.64,
			"Overlap detected. Most engineers default to Cursor.",
			"Coding",
			"med",
		},
		{
			"Batch embedding jobs to off-peak (50% disc.)",
			1900,
			0.74,
			"Workload tolerant to 6h SLA.",
			"OpenAI API",
			"med",
		},
		{
			"Shift eval harness from o3 → claude-sonnet-4.5",
			3800,
			0.7,
			"o3 only marginally better on eval suite; 3.4× cost.",
			"Data & ML",
			"low",
		},
	}

	batch := &pgx.Batch{}
	for _, r := range recommendations {
		batch.Queue(
			`INSERT INTO recommendations (id, org_id, title, reason, savings_usd, confidence, scope, effort, created_at)
			 VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW())
			 ON CONFLICT (org_id, title) DO UPDATE SET
				reason = EXCLUDED.reason,
				savings_usd = EXCLUDED.savings_usd,
				confidence = EXCLUDED.confidence,
				scope = EXCLUDED.scope,
				effort = EXCLUDED.effort`,
			orgID, r.Title, r.Reason, r.Savings, r.Confidence, r.Scope, r.Effort,
		)
	}

	results := tx.SendBatch(ctx, batch)
	defer results.Close()

	for range recommendations {
		if _, err := results.Exec(); err != nil {
			return err
		}
	}

	return nil
}

func seedApprovals(ctx context.Context, tx pgx.Tx) error {
	approvals := []Approval{
		{"Emre Yilmaz", "Runway Enterprise", "Expanding video team; need unlimited exports and API.", 1200, "pending"},
		{"Noor Haddad", "Granola", "Automated meeting notes for all product syncs.", 580, "pending"},
		{"Maya Okafor", "v0 Premium", "Frontend prototype generation for growth squad.", 360, "pending"},
		{"Oren Adler", "Apollo.io AI", "Enriching outbound workflows.", 820, "approved"},
		{"Brooke Yi", "Intercom Fin", "Deflect tier-1 tickets.", 2400, "denied"},
	}

	batch := &pgx.Batch{}
	for _, a := range approvals {
		batch.Queue(
			`INSERT INTO approvals (id, org_id, requester_name, tool_name, reason, cost_est_usd, status, created_at, updated_at)
			 VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
			 ON CONFLICT (org_id, requester_name, tool_name) DO UPDATE SET
				reason = EXCLUDED.reason,
				cost_est_usd = EXCLUDED.cost_est_usd,
				status = EXCLUDED.status`,
			orgID, a.Requester, a.Tool, a.Reason, a.CostEst, a.Status,
		)
	}

	results := tx.SendBatch(ctx, batch)
	defer results.Close()

	for range approvals {
		if _, err := results.Exec(); err != nil {
			return err
		}
	}

	return nil
}

func seedShadowTools(ctx context.Context, tx pgx.Tx) error {
	shadowTools := []ShadowTool{
		{"Perplexity Pro", 11, "expenses", "Mar 4", 220, "medium"},
		{"Suno", 3, "expenses", "Mar 22", 60, "low"},
		{"Poe", 6, "SSO logs", "Feb 18", 120, "medium"},
		{"Character.AI", 2, "network", "Apr 2", 40, "high"},
		{"Grok (personal)", 4, "network", "Apr 9", 60, "medium"},
	}

	batch := &pgx.Batch{}
	for _, s := range shadowTools {
		batch.Queue(
			`INSERT INTO shadow_tools (id, org_id, tool_name, users_count, source, first_seen, monthly_usd, risk, created_at)
			 VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW())
			 ON CONFLICT (org_id, tool_name) DO UPDATE SET
				users_count = EXCLUDED.users_count,
				source = EXCLUDED.source,
				first_seen = EXCLUDED.first_seen,
				monthly_usd = EXCLUDED.monthly_usd,
				risk = EXCLUDED.risk`,
			orgID, s.Name, s.Users, s.Source, s.FirstSeen, s.Monthly, s.Risk,
		)
	}

	results := tx.SendBatch(ctx, batch)
	defer results.Close()

	for range shadowTools {
		if _, err := results.Exec(); err != nil {
			return err
		}
	}

	return nil
}

func intPtr(i int) *int {
	return &i
}
