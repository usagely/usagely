# ee/AGENTS.md

Scoped rules for the enterprise extension directory.

## License boundary

`ee/` is **commercial-licensed**; the rest of the repo is **AGPL-3.0**. Code
MUST NOT cross the boundary in either direction without explicit human approval:

- Do not copy AGPL OSS code into `ee/` — it would re-license the EE bundle.
- Do not import from `ee/` in any path under `apps/`, `server/`, or anywhere
  else outside `ee/` — that breaks the OSS build for users who don't have EE.

## Working in `ee/` from an OSS task

Forbidden. If a task asks for a feature that touches `ee/`, stop and confirm
with the human first.

## Reference

- Root [`LICENSE`](../LICENSE) (AGPL-3.0)
- [`ee/LICENSE`](LICENSE) (commercial)
- `README.md` License section
