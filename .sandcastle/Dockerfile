# Sandcastle sandbox image for the Usagely monorepo.
#
# Base image and `agent` user setup match the upstream sandcastle Claude Code
# template (https://github.com/mattpocock/sandcastle). The Usagely-specific
# additions are: Go 1.25 toolchain, pnpm 9 (matching root package.json
# `packageManager`), make, postgresql-client, build-essential, and GitHub CLI
# so the agent can run `make build`, `make test`, `make migrate`, and `gh` from
# inside the sandbox.
#
# Customising rules (do NOT remove):
#   - Keep the non-root `agent` user — Claude Code refuses to run as root.
#   - Keep `git`, `gh`, and the Claude Code CLI on PATH.
#   - Keep `ENTRYPOINT ["sleep", "infinity"]` — sandcastle execs into the
#     container, the entrypoint just keeps it alive.

FROM node:22-bookworm

# ---------------------------------------------------------------------------
# System dependencies (sandcastle defaults + Usagely build tools)
# ---------------------------------------------------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    jq \
    make \
    ca-certificates \
    build-essential \
    postgresql-client \
    sudo \
    gnupg \
  && rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------------------
# GitHub CLI (`gh`) — required by sandcastle for issue/PR fetching
# ---------------------------------------------------------------------------
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    | gpg --dearmor -o /usr/share/keyrings/githubcli-archive-keyring.gpg \
  && chmod 644 /usr/share/keyrings/githubcli-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
    > /etc/apt/sources.list.d/github-cli.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends gh \
  && rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------------------
# Go 1.25 toolchain (Usagely backend)
# Installs from the official tarball into /usr/local/go.
# Architecture is detected at build time so the image works on amd64 and arm64.
# ---------------------------------------------------------------------------
ENV GO_VERSION=1.25.1
RUN set -eux; \
    arch="$(dpkg --print-architecture)"; \
    case "$arch" in \
      amd64) goArch=amd64 ;; \
      arm64) goArch=arm64 ;; \
      *) echo "unsupported arch: $arch" >&2; exit 1 ;; \
    esac; \
    curl -fsSL "https://go.dev/dl/go${GO_VERSION}.linux-${goArch}.tar.gz" \
      -o /tmp/go.tar.gz; \
    tar -C /usr/local -xzf /tmp/go.tar.gz; \
    rm /tmp/go.tar.gz
ENV PATH="/usr/local/go/bin:${PATH}"
ENV GOPATH="/home/agent/go"

# ---------------------------------------------------------------------------
# Enable corepack as root (writes shims into /usr/local). The actual pnpm
# binary download is done after USER agent so the cache lands in the agent's
# home and survives in the final image — otherwise the agent would have to
# fetch pnpm@9.0.0 on every first run inside the worktree.
# ---------------------------------------------------------------------------
RUN corepack enable

# ---------------------------------------------------------------------------
# Rename base image's "node" user (UID 1000) to "agent" — sandcastle convention
# Grant passwordless sudo so sandbox.onSandboxReady hooks with sudo: true work.
# ---------------------------------------------------------------------------
RUN usermod -d /home/agent -m -l agent node \
  && groupmod -n agent node \
  && echo "agent ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/agent \
  && chmod 0440 /etc/sudoers.d/agent

USER agent

# Pre-fetch pnpm 9.0.0 into the agent's corepack cache so worktrees with
# `"packageManager": "pnpm@9.0.0"` (matches root package.json) use it offline.
RUN corepack prepare pnpm@9.0.0 --activate \
  && pnpm --version

# ---------------------------------------------------------------------------
# Claude Code CLI — install in agent's home (per sandcastle template)
# ---------------------------------------------------------------------------
RUN curl -fsSL https://claude.ai/install.sh | bash
ENV PATH="/home/agent/.local/bin:${PATH}:/home/agent/go/bin"

WORKDIR /home/agent

# Sandcastle bind-mounts the git worktree at ${SANDBOX_REPO_DIR} and overrides
# the working directory at container start, so this WORKDIR is only the idle
# default for `sleep infinity`.
ENTRYPOINT ["sleep", "infinity"]
