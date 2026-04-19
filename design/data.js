// Usagely — mock data
window.LAI_DATA = (() => {
  const teams = [
    { id: 'eng', name: 'Engineering', members: 48, color: 'var(--chart-1)' },
    { id: 'prod', name: 'Product', members: 22, color: 'var(--chart-2)' },
    { id: 'data', name: 'Data & ML', members: 19, color: 'var(--chart-3)' },
    { id: 'mkt', name: 'Marketing', members: 14, color: 'var(--chart-4)' },
    { id: 'cs', name: 'Customer Support', members: 12, color: 'var(--chart-5)' },
    { id: 'sales', name: 'Sales', members: 9,  color: 'oklch(0.62 0.14 200)' },
    { id: 'hr', name: 'People Ops', members: 6, color: 'oklch(0.68 0.12 50)' },
    { id: 'fin', name: 'Finance', members: 5, color: 'oklch(0.62 0.12 280)' },
  ];

  const tools = [
    { id: 'oai-api', name: 'OpenAI API', vendor: 'OpenAI', category: 'LLM API', status: 'approved', seats: null, spend: 42310, prev: 36120, prov: 'key' },
    { id: 'anth-api', name: 'Anthropic API', vendor: 'Anthropic', category: 'LLM API', status: 'approved', seats: null, spend: 38790, prev: 28420, prov: 'key' },
    { id: 'google-api', name: 'Google Vertex', vendor: 'Google', category: 'LLM API', status: 'approved', seats: null, spend: 9120, prev: 8100, prov: 'key' },
    { id: 'copilot', name: 'GitHub Copilot', vendor: 'GitHub', category: 'Coding', status: 'approved', seats: 42, spend: 798, prev: 760, prov: 'sso' },
    { id: 'cursor', name: 'Cursor', vendor: 'Cursor', category: 'Coding', status: 'approved', seats: 38, spend: 1520, prev: 1140, prov: 'sso' },
    { id: 'claude-code', name: 'Claude Code', vendor: 'Anthropic', category: 'Coding', status: 'approved', seats: 30, spend: 4200, prev: 3100, prov: 'sso' },
    { id: 'chatgpt-team', name: 'ChatGPT Team', vendor: 'OpenAI', category: 'Chat seat', status: 'approved', seats: 78, spend: 2340, prev: 2340, prov: 'sso' },
    { id: 'claude-teams', name: 'Claude Teams', vendor: 'Anthropic', category: 'Chat seat', status: 'approved', seats: 65, spend: 1950, prev: 1680, prov: 'sso' },
    { id: 'mj', name: 'Midjourney', vendor: 'Midjourney', category: 'Image', status: 'approved', seats: 8, spend: 256, prev: 240, prov: 'manual' },
    { id: 'runway', name: 'Runway', vendor: 'Runway', category: 'Video', status: 'approved', seats: 4, spend: 380, prev: 360, prov: 'manual' },
    { id: 'eleven', name: 'ElevenLabs', vendor: 'ElevenLabs', category: 'Voice', status: 'approved', seats: 6, spend: 720, prev: 580, prov: 'key' },
    { id: 'whisper', name: 'Whisper API', vendor: 'OpenAI', category: 'Voice', status: 'approved', seats: null, spend: 340, prev: 290, prov: 'key' },
    { id: 'perplexity', name: 'Perplexity', vendor: 'Perplexity', category: 'Chat seat', status: 'shadow', seats: 11, spend: 220, prev: 0, prov: 'detected' },
    { id: 'v0', name: 'v0', vendor: 'Vercel', category: 'Coding', status: 'pending', seats: 12, spend: 0, prev: 0, prov: 'request' },
    { id: 'suno', name: 'Suno', vendor: 'Suno', category: 'Audio', status: 'shadow', seats: 3, spend: 60, prev: 0, prov: 'detected' },
  ];

  const models = [
    { name: 'claude-sonnet-4.5', vendor: 'Anthropic', tokens_in: 128_400_000, tokens_out: 21_300_000, calls: 412_330, cost: 21800, avg_latency: 1.8 },
    { name: 'claude-opus-4',     vendor: 'Anthropic', tokens_in: 22_100_000,  tokens_out: 5_400_000,  calls: 48_120,  cost: 12400, avg_latency: 2.9 },
    { name: 'gpt-4o',            vendor: 'OpenAI',    tokens_in: 96_200_000,  tokens_out: 14_800_000, calls: 311_900, cost: 18200, avg_latency: 1.5 },
    { name: 'gpt-4.1-mini',      vendor: 'OpenAI',    tokens_in: 210_000_000, tokens_out: 28_600_000, calls: 612_400, cost: 14600, avg_latency: 0.9 },
    { name: 'o3',                vendor: 'OpenAI',    tokens_in: 4_100_000,   tokens_out: 1_800_000,  calls: 2_310,   cost: 6200,  avg_latency: 8.1 },
    { name: 'gemini-2.5-pro',    vendor: 'Google',    tokens_in: 58_000_000,  tokens_out: 6_400_000,  calls: 71_200,  cost: 7300,  avg_latency: 1.7 },
    { name: 'gemini-2.5-flash',  vendor: 'Google',    tokens_in: 140_000_000, tokens_out: 12_000_000, calls: 292_100, cost: 1820,  avg_latency: 0.6 },
  ];

  // Daily spend last 60 days (USD)
  const today = new Date('2026-04-19');
  const daily = [];
  let base = 2400;
  for (let i = 59; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const weekday = d.getDay();
    const weekMult = (weekday === 0 || weekday === 6) ? 0.55 : 1;
    const growth = 1 + (59 - i) * 0.008;
    const noise = 0.9 + Math.random() * 0.25;
    let val = base * weekMult * growth * noise;
    // Inject an anomaly spike on day -4
    if (i === 4) val *= 1.9;
    daily.push({ date: d.toISOString().slice(0, 10), value: Math.round(val) });
  }

  const users = [
    { name: 'Clara Mendes',     email: 'clara@acme.co',     team: 'Engineering',   role: 'Senior Eng',     tokens: 18_420_000, cost: 1420, prs: 34, topTool: 'Claude Code' },
    { name: 'Diego Ramos',      email: 'diego@acme.co',     team: 'Engineering',   role: 'Staff Eng',      tokens: 22_100_000, cost: 1980, prs: 41, topTool: 'Cursor' },
    { name: 'Harper Lin',       email: 'harper@acme.co',    team: 'Data & ML',     role: 'ML Eng',         tokens: 41_300_000, cost: 2840, prs: 18, topTool: 'OpenAI API' },
    { name: 'Noor Haddad',      email: 'noor@acme.co',      team: 'Product',       role: 'PM',             tokens: 2_140_000,  cost: 182,  prs: 0,  topTool: 'ChatGPT Team' },
    { name: 'Tomás Alvarez',    email: 'tomas@acme.co',     team: 'Data & ML',     role: 'Data Sci',       tokens: 38_700_000, cost: 2120, prs: 6,  topTool: 'Anthropic API' },
    { name: 'Priya Rao',        email: 'priya@acme.co',     team: 'Engineering',   role: 'Eng Mgr',        tokens: 4_320_000,  cost: 310,  prs: 8,  topTool: 'Claude Teams' },
    { name: 'Emre Yilmaz',      email: 'emre@acme.co',      team: 'Marketing',     role: 'Content Lead',   tokens: 1_980_000,  cost: 148,  prs: 0,  topTool: 'Midjourney' },
    { name: 'Brooke Yi',        email: 'brooke@acme.co',    team: 'Customer Support', role: 'CS Lead',     tokens: 3_420_000,  cost: 220,  prs: 0,  topTool: 'Claude Teams' },
    { name: 'Samir Nouri',      email: 'samir@acme.co',     team: 'Engineering',   role: 'Eng',            tokens: 14_820_000, cost: 1140, prs: 22, topTool: 'Cursor' },
    { name: 'Ines Cardoso',     email: 'ines@acme.co',      team: 'Product',       role: 'Design',         tokens: 840_000,    cost: 62,   prs: 0,  topTool: 'ChatGPT Team' },
    { name: 'Oren Adler',       email: 'oren@acme.co',      team: 'Sales',         role: 'AE',             tokens: 1_230_000,  cost: 94,   prs: 0,  topTool: 'ChatGPT Team' },
    { name: 'Riya Kapoor',      email: 'riya@acme.co',      team: 'Data & ML',     role: 'ML Eng',         tokens: 29_400_000, cost: 1820, prs: 5,  topTool: 'Anthropic API' },
    { name: 'Luca Ferretti',    email: 'luca@acme.co',      team: 'Engineering',   role: 'Eng',            tokens: 11_300_000, cost: 840,  prs: 19, topTool: 'Claude Code' },
    { name: 'Maya Okafor',      email: 'maya@acme.co',      team: 'Engineering',   role: 'Senior Eng',     tokens: 16_900_000, cost: 1280, prs: 28, topTool: 'Claude Code' },
  ];

  const budgets = [
    { id: 'b1', scope: 'Engineering', period: 'Monthly', limit: 32000, used: 28420, alert: 85 },
    { id: 'b2', scope: 'Data & ML',   period: 'Monthly', limit: 28000, used: 27100, alert: 90 },
    { id: 'b3', scope: 'Product',     period: 'Monthly', limit: 4000,  used: 1870,  alert: 80 },
    { id: 'b4', scope: 'Marketing',   period: 'Monthly', limit: 2000,  used: 1240,  alert: 75 },
    { id: 'b5', scope: 'CS',          period: 'Monthly', limit: 3500,  used: 1380,  alert: 80 },
    { id: 'b6', scope: 'Company',     period: 'Quarterly', limit: 320000, used: 218000, alert: 80 },
  ];

  const anomalies = [
    { id: 'a1', when: '2 hours ago', title: 'Anthropic API spend +187% vs 7-day avg', body: 'Spike isolated to `prod-rag-indexer` service — possible loop.', severity: 'danger', team: 'Engineering', owner: 'Clara Mendes' },
    { id: 'a2', when: 'Yesterday',   title: 'Data & ML team at 97% of monthly budget', body: '11 days remaining in period. Projected $31.4k vs $28k limit.', severity: 'warn', team: 'Data & ML', owner: 'Harper Lin' },
    { id: 'a3', when: '2 days ago',  title: 'Unapproved tool detected: Perplexity', body: '11 members expensed Perplexity Pro in last 30 days.', severity: 'warn', team: 'Mixed', owner: '—' },
    { id: 'a4', when: '3 days ago',  title: 'o3 usage spike — 8.2k calls in 2h',     body: 'Ran on `eval-harness` by Tomás. $420 of o3 burn.', severity: 'danger', team: 'Data & ML', owner: 'Tomás Alvarez' },
  ];

  const recommendations = [
    { id: 'r1', title: 'Downgrade 64% of gpt-4o calls to gpt-4.1-mini', savings: 8120, confidence: 0.82, reason: 'Low-complexity classification & extraction prompts; <1% quality loss on eval set.', scope: 'API · Engineering', effort: 'low' },
    { id: 'r2', title: 'Enable prompt caching on `rag-assistant`',      savings: 4200, confidence: 0.91, reason: '38% of tokens repeat within 5m window. Cache-hit saves ~70% input cost.', scope: 'Anthropic · Data', effort: 'low' },
    { id: 'r3', title: 'Reclaim 14 inactive Copilot seats',             savings: 266,  confidence: 0.98, reason: 'No completions accepted in last 30 days.', scope: 'GitHub Copilot', effort: 'low' },
    { id: 'r4', title: 'Consolidate Cursor + Copilot for 22 engineers', savings: 418,  confidence: 0.64, reason: 'Overlap detected. Most engineers default to Cursor.', scope: 'Coding', effort: 'med' },
    { id: 'r5', title: 'Batch embedding jobs to off-peak (50% disc.)',  savings: 1900, confidence: 0.74, reason: 'Workload tolerant to 6h SLA.', scope: 'OpenAI API', effort: 'med' },
    { id: 'r6', title: 'Shift eval harness from o3 → claude-sonnet-4.5',savings: 3800, confidence: 0.7,  reason: 'o3 only marginally better on eval suite; 3.4× cost.', scope: 'Data & ML', effort: 'low' },
  ];

  const approvals = [
    { id: 'p1', requester: 'Emre Yilmaz', tool: 'Runway Enterprise', reason: 'Expanding video team; need unlimited exports and API.', cost_est: 1200, when: 'Today, 09:42', status: 'pending' },
    { id: 'p2', requester: 'Noor Haddad', tool: 'Granola',        reason: 'Automated meeting notes for all product syncs.',    cost_est: 580,  when: '1 day ago',  status: 'pending' },
    { id: 'p3', requester: 'Maya Okafor', tool: 'v0 Premium',     reason: 'Frontend prototype generation for growth squad.',    cost_est: 360,  when: '2 days ago', status: 'pending' },
    { id: 'p4', requester: 'Oren Adler',  tool: 'Apollo.io AI',   reason: 'Enriching outbound workflows.',                     cost_est: 820,  when: '3 days ago', status: 'approved' },
    { id: 'p5', requester: 'Brooke Yi',   tool: 'Intercom Fin',   reason: 'Deflect tier-1 tickets.',                           cost_est: 2400, when: '5 days ago', status: 'denied' },
  ];

  const shadow = [
    { tool: 'Perplexity Pro',  users: 11, source: 'expenses', first_seen: 'Mar 4', monthly: 220, risk: 'medium' },
    { tool: 'Suno',            users: 3,  source: 'expenses', first_seen: 'Mar 22', monthly: 60, risk: 'low' },
    { tool: 'Poe',             users: 6,  source: 'SSO logs', first_seen: 'Feb 18', monthly: 120, risk: 'medium' },
    { tool: 'Character.AI',    users: 2,  source: 'network',  first_seen: 'Apr 2',  monthly: 40,  risk: 'high' },
    { tool: 'Grok (personal)', users: 4,  source: 'network',  first_seen: 'Apr 9',  monthly: 60,  risk: 'medium' },
  ];

  return { teams, tools, models, daily, users, budgets, anomalies, recommendations, approvals, shadow };
})();
