# ModMail-Bot - Project Overview

> **Note**: This document provides a comprehensive overview of the ModMail-Bot project for AI agents and developers.

## Project Description

**ModMail-Bot** is a standalone Discord bot designed for handling moderation mail (direct messages) between users and server staff. It was migrated from a legacy codebase to a modern TypeScript/Docker stack.

## Key Technologies

- **Runtime**: Node.js (v20+)
- **Language**: TypeScript (strict mode)
- **Module System**: ES Modules (`import`/`export`)
- **Package Manager**: PNPM (Workspace Root)
- **Framework**: discord.js v14
- **Containerization**: Docker
- **Validation**: Zod
- **Tooling**: TurboRepo, ESLint, Prettier, Husky, Commitlint

## Architecture Overview

### Core Components

1.  **Discord Client**: Handles gateway connection and events.
2.  **Event Handlers**: Processes `messageCreate` (DM/Guild) and interactions.
3.  **Command System**: Slash commands for moderation actions.
4.  **Logging**: Winston-based logging.

### Directory Structure

```
modmail-bot/
├── .agent/                 # Agent context & rules
├── .github/                # CI/CD workflows
├── apps/
│   └── modmail-bot/        # Main bot application
│       ├── src/
│       │   ├── commands/   # Slash commands
│       │   ├── events/     # Event handlers
│       │   ├── discord/    # Client setup
│       │   ├── config.ts   # Configuration
│       │   └── index.ts    # Entry point
│       ├── Dockerfile
│       └── package.json
├── package.json            # Root workspace
├── pnpm-workspace.yaml     # Workspace configuration
└── turbo.json              # Turbo build config
```

## Development Setup

### Prerequisites

- Node.js v20+
- PNPM (v9+)
- Docker (optional)

### Installation

```bash
pnpm install
pnpm build
# Start dev mode
pnpm dev
```

## Key Features

- **DM Relaying**: Forward DMs to a staff channel.
- **Staff Replies**: Reply to users via ModMail threads.
- **Thread Management**: Close/Archive tickets.
- **Logging**: Audit logs for all interactions.
