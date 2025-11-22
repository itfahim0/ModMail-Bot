# 📮 ModMail Bot

A clean, modern ModMail system for Discord that lets users open support tickets by simply DMing the bot. Staff can reply, manage, and close tickets from inside your server.

This README includes:

- Setup guide
- Environment variables
- How to run locally
- Deployment (PM2, Docker, Railway)
- Full command usage
- Ticket workflow
- Troubleshooting
- Customization tips

## 📑 Table of Contents

- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Running the Bot](#-running-the-bot)
- [Deployment](#-deployment)
- [How ModMail Works](#-how-modmail-works)
- [User Guide](#-user-guide)
- [Staff Commands](#-staff-commands)
- [Admin Commands](#-admin-commands)
- [Ticket Flow Summary](#-ticket-flow-summary)
- [Customization Tips](#-customization-tips)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

## ✨ Features

- Easy DM → Ticket creation
- Staff reply relayed to user DMs
- Ticket claiming
- Ticket closing with optional reasons
- Message logging & transcripts
- Category-based ticket organization
- Permission-managed staff access
- Customizable responses & embeds
- Works with Node.js (discord.js)

## 🧰 Prerequisites

Before installing, make sure you have:

- Node.js v18 or later
- npm or yarn
- A Discord Bot Token
- A Discord server where the bot will operate

## 📥 Installation

### Clone the repository
```bash
git clone https://github.com/itfahim0/ModMail-Bot.git
cd ModMail-Bot
```

### Install dependencies
```bash
npm install
```

### Create Config

You must create a `.env` file (details below).

## 🔐 Environment Variables

Create a file named `.env` in the project root:

```env
# Discord Bot
DISCORD_TOKEN=your-token-here
CLIENT_ID=your-client-id
GUILD_ID=your-guild-id

# IDs used by the bot
MODMAIL_CATEGORY_ID=123456789012345678
LOG_CHANNEL_ID=123456789012345678
```

⚠️ **Never upload your .env to GitHub.**

## ▶️ Running the Bot

### Development mode
```bash
npm run dev
```

### Production mode
```bash
npm start
```

If your entry file is different (src/index.js, bot.js, etc.), update your package.json scripts.

## 🚀 Deployment

### PM2 (VPS Deployment)
```bash
npm install -g pm2
pm2 start index.js --name modmail
pm2 save
pm2 startup
```

### Docker

Example Dockerfile:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["node", "index.js"]
```

Build & run:

```bash
docker build -t modmail .
docker run -d --env-file .env modmail
```

### Railway / Replit

1. Connect GitHub repo
2. Add environment variables
3. Set start command → `node index.js`

## 📘 How ModMail Works

1. A user sends the bot a DM.
2. The bot creates a ticket channel in your server.
3. Staff reply inside the channel using commands.
4. The bot forwards staff messages back to the user via DM.
5. Staff close the ticket when finished.

Everything stays organized and private.

## 👤 User Guide

Users do not need commands.

They just:

**1️⃣ Send a DM to the bot**

Example:
```
"Hello, I need help."
```

Bot will automatically create a ticket.

**2️⃣ Continue conversation**

All messages get forwarded to the staff ticket channel.

## 🛠️ Staff Commands

### 📨 Reply to User
```
!reply <message>
```

Example:
```
!reply Hello! How can I assist you?
```

### 👀 Ticket Info
```
!ticket
```

### 🧹 Close Ticket
```
!close
```

or with a reason:
```
!close User issue resolved
```

### 📌 Claim Ticket
```
!claim
```

### 📝 Add Staff Note (if enabled)
```
!note <text>
```

### 📄 Transcript
```
!transcript
```

## 🔧 Admin Commands

### 🛠️ Setup ModMail System
```
!setup
```

### 👥 Set Staff Role
```
!setstaff <@role>
```

### 🗂️ Set Ticket Category
```
!setcategory <categoryID>
```

### 📨 Set Log Channel
```
!setlog <channelID>
```

## 🧭 Ticket Flow Summary

**User DMs Bot → Bot creates ticket → Staff reply → Bot forwards DM → Staff close ticket.**

A simple workflow for server support.

## 🛠 Customization Tips

- Add slash commands
- Add embeds for ticket creation
- Add HTML/PDF transcripts
- Add auto-welcome message on ticket open
- Add multi-language support (Bangla + English)
- Add blacklisted words for ticket filtering
- Add cooldowns to prevent spam

## ❗ Troubleshooting

### Bot not online
- Check token in .env
- Check Node.js version
- Ensure the bot is invited with required permissions

### Bot cannot create channels
- Missing Manage Channels permission
- Category ID invalid

### Bot cannot DM users
- User disabled DMs
- Bot blocked
- User privacy settings

### Messages not forwarding
- Check messageCreate event logic
- Ensure bot distinguishes DM vs Guild messages

## 📄 License

Add a LICENSE file if you want (MIT recommended).
