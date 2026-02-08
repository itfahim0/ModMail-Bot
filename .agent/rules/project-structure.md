# 📂 Project Structure (ModMail-Bot)

## Root

- `apps/`: Application packages.
    - `modmail-bot/`: Main Discord bot logic.
- `.agent/rules/`: Agent context and rules.
- `.github/`: CI/CD Workflows.
- `docs/`: Project documentation.
- `scripts/`: Dev scripts.

## Key Files

- `package.json`: Workspace root (turbo, lint, format).
- `turbo.json`: Build pipeline config.
- `pnpm-workspace.yaml`: Workspace definition.

## Conventions

- **Monorepo**: TurboRepo via pnpm workspaces.
- **Config**: Environment variables in `.env`.
- **Scripts**: `pnpm` commands in root delegate via turbo.

## Application Structure (apps/modmail-bot)

- `src/index.ts`: Entry point.
- `src/discord/`: Client initialization.
- `src/commands/`: Slash command modules.
- `src/events/`: Event handlers.
- `Dockerfile`: Multi-stage build.
