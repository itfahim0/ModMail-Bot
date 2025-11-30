# 📮 ModMail Bot

![Discord.js](https://img.shields.io/badge/discord.js-v14-blue?style=for-the-badge&logo=discord)
![Node.js](https://img.shields.io/badge/node.js-v18+-green?style=for-the-badge&logo=node.js)
![Status](https://img.shields.io/badge/status-active-success?style=for-the-badge)

A professional, feature-rich ModMail system for Discord. This bot facilitates private communication between server members and staff through a dedicated ticket system, ensuring privacy and organization.

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [📂 Project Structure](#-project-structure)
- [🛠️ Prerequisites](#-prerequisites)
- [📥 Installation](#-installation)
- [⚙️ Configuration](#-configuration)
- [🚀 Running the Bot](#-running-the-bot)
- [☁️ Deployment (PM2)](#-deployment-pm2)
- [📖 User Manual](#-user-manual)
- [🤖 Command Reference](#-command-reference)
- [❓ Troubleshooting](#-troubleshooting)

---

## ✨ Features

- **Seamless Ticket Creation**: Users simply DM the bot to open a ticket.
- **Interactive Dashboard**: Staff manage tickets via buttons and slash commands.
- **Advanced Announcements**: Send plain text announcements with attachments and links via an interactive dashboard.
- **Moderation Suite**: Kick, Ban, Mute, Warn, and History tracking.
- **Transcripts**: Auto-generated transcripts for closed tickets.
- **Customizable**: Easy configuration for roles, categories, and messages.

---

## 📂 Project Structure

```text
ModMail-Bot/
├── data/                  # JSON data storage (announcements, etc.)
├── deploy/                # Deployment scripts
├── src/
│   ├── commands/          # Slash commands organized by category
│   │   ├── admin/         # Admin-only commands (announce, config, etc.)
│   │   ├── fun/           # Fun commands (meme, avatar)
│   │   ├── moderation/    # Moderation tools (ban, kick, mute)
│   │   ├── modmail/       # ModMail specific commands (reply, close)
│   │   └── utils/         # Utility commands (help, stats)
│   ├── database/          # Database connection logic
│   ├── events/            # Event handlers (messageCreate, interactionCreate)
│   ├── middleware/        # Rate limiting and other middleware
│   └── services/          # Business logic services
├── .env                   # Environment variables (Secrets)
├── index.js               # Main entry point
├── pm2.config.js          # PM2 configuration
└── package.json           # Dependencies and scripts
```

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

- **[Node.js](https://nodejs.org/)** (v18 or higher)
- **[npm](https://www.npmjs.com/)** (usually comes with Node.js)
- A **Discord Bot Token** from the [Discord Developer Portal](https://discord.com/developers/applications).
- **PM2** (for production deployment).

---

## 📥 Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/itfahim0/ModMail-Bot.git
    cd ModMail-Bot
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Setup Configuration**
    Copy the `.env.example` (if available) or create a new `.env` file.

---

## ⚙️ Configuration

Create a file named `.env` in the root directory and fill in the following details:

```env
# --- Bot Credentials ---
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here
GUILD_ID=your_server_id_here

# --- ModMail Settings ---
MODMAIL_CATEGORY_ID=category_id_for_tickets
LOG_CHANNEL_ID=channel_id_for_logs
GUILD_ID=your_main_server_id

# --- Roles (Optional/Auto-configured) ---
STAFF_ROLE_ID=role_id_for_staff
ADMIN_ROLE_ID=role_id_for_admins
```

> **⚠️ IMPORTANT**: Never share your `.env` file or commit it to GitHub. It contains your secret token.

---

## 🚀 Running the Bot

### Development Mode
Use this for testing and making changes. It uses `nodemon` to restart on file changes.
```bash
npm run dev
```

### Production Mode
Use this for running the bot normally.
```bash
npm start
```

---

## ☁️ Deployment (PM2)

For a professional 24/7 hosting setup, we recommend using **PM2** (Process Manager 2).

### 1. Install PM2 Globally
```bash
npm install pm2 -g
```

### 2. Start the Bot
You can start the bot using the ecosystem file (if present) or directly:
```bash
pm2 start index.js --name "ModMail"
```

### 3. Save & Startup
Ensure the bot restarts automatically if the server reboots.
```bash
pm2 save
pm2 startup
```
Follow the instructions output by `pm2 startup` to finalize the setup.

### Useful PM2 Commands
- `pm2 status`: Check bot status.
- `pm2 logs ModMail`: View live logs.
- `pm2 restart ModMail`: Restart the bot.
- `pm2 stop ModMail`: Stop the bot.

---

## 📖 User Manual

### For Users (Members)
- **Opening a Ticket**: Simply send a Direct Message (DM) to the bot. A private channel will be created for you on the server.
- **Replying**: Continue sending messages in the DM. The bot forwards them to the staff.

### For Staff
- **Replying to Tickets**: Go to the ticket channel created in the server and type your message. The bot relays it to the user.
- **Closing Tickets**: Use the `/close` command or click the "Close" button (if available) to archive the ticket.
- **Commands**: Use slash commands (`/`) for all interactions.

### For Admins
- **Setup**: Run `/modmail-setup` to automatically create the necessary categories and channels.
- **Announcements**: Use `/announce` to send broadcast messages to channels with attachments and mentions.

---

## 🤖 Command Reference

### 📨 ModMail
| Command | Description |
| :--- | :--- |
| `/reply [message]` | Send a reply to the ticket user (or just type in the channel). |
| `/close [reason]` | Close the current ticket. |
| `/claim` | Claim a ticket so only you can handle it. |
| `/transcript` | Generate and save a transcript of the ticket. |

### 🛡️ Moderation
| Command | Description |
| :--- | :--- |
| `/ban [user] [reason]` | Ban a member from the server. |
| `/kick [user] [reason]` | Kick a member from the server. |
| `/mute [user] [duration]` | Timeout/Mute a member. |
| `/warn [user] [reason]` | Issue a warning to a user. |
| `/history [user]` | View a user's moderation history. |

### 👑 Admin
| Command | Description |
| :--- | :--- |
| `/announce` | Open the Interactive Announcement Dashboard. |
| `/config` | View or edit bot configuration. |
| `/autorole` | Configure auto-roles for new members. |
| `/modmail-setup` | Initialize ModMail categories and permissions. |

### 🎉 Utility & Fun
| Command | Description |
| :--- | :--- |
| `/help` | Show the help menu. |
| `/ping` | Check bot latency. |
| `/stats` | View bot uptime and usage stats. |
| `/avatar [user]` | Display a user's avatar. |

---

## ❓ Troubleshooting

**Q: The bot isn't responding to DMs.**
A: Ensure `Direct Message Intents` are enabled in the Discord Developer Portal under the "Bot" tab.

**Q: "Application not responding" error.**
A: Check the console logs for errors. Ensure the bot is running and the token is correct.

**Q: Mentions aren't working in announcements.**
A: The `/announce` command sends plain text messages now. Ensure you are selecting the correct roles/users in the dashboard or typing them correctly in the interactive chat setup.

---

*Built with ❤️ by [Your Name/Team]*
