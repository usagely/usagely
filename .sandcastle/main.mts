/**
 * Sandcastle entry point for the Usagely monorepo.
 *
 * Run from repo root:
 *   pnpm sandcastle "<task description>"
 *
 * `.mts` (rather than `.ts`) so top-level `await` works without forcing the
 * root `package.json` to `"type": "module"`, which would change resolution
 * for every other tool in the repo.
 *
 * Provider:    Docker (bind-mount), image `sandcastle:usagely` by default.
 * Agent:       claude-code, model claude-opus-4-6.
 * Auth:        Claude Pro/Max subscription. Sandcastle does not officially
 *              support subscription auth (upstream wontfix:
 *              https://github.com/mattpocock/sandcastle/issues/191), so we
 *              bind-mount the host's `~/.claude` directory and `~/.claude.json`
 *              into the sandbox. The container's `agent` user is UID 1000,
 *              which on most dev workstations matches the host UID — if it
 *              does not, the in-container Claude CLI will be unable to read
 *              the credentials and will fall back to asking for a key.
 * Branch:      merge-to-head — agent works on a throwaway branch which is
 *              then merged back into HEAD. Switch to `{ type: "branch",
 *              branch: "agent/<slug>" }` if you want commits to land on a
 *              named branch (e.g. for opening a PR).
 * Hooks:       `pnpm install` and `go mod download` run inside the sandbox
 *              so the agent starts with warm caches.
 *
 * See .sandcastle/README.md for the full contributor guide.
 */
import { run, claudeCode } from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// Args: either `--file <path>` (preferred for multi-line tasks containing
// backticks/$/quotes — bypasses pnpm's sh -c re-parse of script args) or a
// trailing positional task string.
const argv = process.argv.slice(2);
let task = "";
const fileFlag = argv.indexOf("--file");
if (fileFlag !== -1) {
  const path = argv[fileFlag + 1];
  if (!path) {
    console.error("--file requires a path");
    process.exit(1);
  }
  task = readFileSync(path, "utf8").trim();
} else {
  task = argv.join(" ").trim();
}
if (!task) {
  console.error(
    'usage: pnpm sandcastle "<task description>"\n' +
      "       pnpm sandcastle --file <path-to-task.txt>\n" +
      "       (the task string is substituted into .sandcastle/prompt.md as {{TASK}})",
  );
  process.exit(1);
}

const claudeDir = join(homedir(), ".claude");
const claudeJson = join(homedir(), ".claude.json");
const hasSubscription =
  existsSync(join(claudeDir, ".credentials.json")) && existsSync(claudeJson);

if (!hasSubscription && !process.env.ANTHROPIC_API_KEY) {
  console.error(
    "No Claude credentials found. Either:\n" +
      "  • Log in to Claude Code on the host (`claude login`) so subscription\n" +
      `    creds appear at ${claudeDir}/.credentials.json, or\n` +
      "  • Set ANTHROPIC_API_KEY in .sandcastle/.env (copy from .env.example).",
  );
  process.exit(1);
}

const result = await run({
  agent: claudeCode("claude-opus-4-6"),
  sandbox: docker({
    imageName: "sandcastle:usagely",
    mounts: hasSubscription
      ? [
          { hostPath: claudeDir, sandboxPath: "/home/agent/.claude" },
          { hostPath: claudeJson, sandboxPath: "/home/agent/.claude.json" },
        ]
      : undefined,
  }),
  branchStrategy: { type: "merge-to-head" },
  promptFile: ".sandcastle/prompt.md",
  promptArgs: { TASK: task },
  maxIterations: 10,
  hooks: {
    sandbox: {
      onSandboxReady: [
        { command: "pnpm install --frozen-lockfile", timeoutMs: 600_000 },
        { command: "cd server && go mod download", timeoutMs: 300_000 },
      ],
    },
  },
});

console.log(
  `\nrun finished — ${result.iterations.length} iteration(s), ` +
    `${result.commits.length} commit(s) on branch ${result.branch}.`,
);
