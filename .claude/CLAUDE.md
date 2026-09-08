# CLAUDE.md

@../AGENTS.md

## Claude Code

### Plan Mode

- Use plan mode anytime new features are being added or old features are receiving significant updates.
- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.

### Tasks

Markdown files under `.claude/tasks/`, flat: no backlog or completed folders at this size. Each opens with YAML frontmatter: `status` (`proposal` | `accepted` | `deferred` | `superseded`), `created` (ISO date), and optional `area`. Converted plans may also carry `priority` / `effort` / `depends` / `source` / `updated` / `progress`.

Completion is not a status: delete a task once its work lands, folding anything worth keeping into the code, `AGENTS.md`, or `context.md`.
