🤖 Discord Modmail & Management Bot

A powerful, lightweight Discord bot built with Discord.js v14. This bot combines a support ticket system (Modmail), advanced server logging, and an announcement system with Mass DM capabilities.

✨ Features

📨 Modmail System

DM to Ticket: When a user DMs the bot, the message is forwarded to a specific staff channel.

Staff Reply: Moderators can reply to the ticket by replying to the forwarded message in the channel.

Attachments: Supports forwarding images and files.

Close Command: Staff can close tickets using !close, sending a notification to the user.

📢 Announcement System

Slash Command: /announce opens a clean pop-up form (Modal).

Customizable: Set a Title, Message Content, and Footer/Mentions.

Mass DM (Optional): Option to send the announcement to every member in the server via DM.

Note: Includes safety delays to prevent rate limits.

🛡️ Server Logging (Audit)

Voice Logs: Tracks Joining, Leaving, and Moving between voice channels (Visual 1-line logs).

Invite Logs: Tracks who created new invite links.

Server Updates: Logs changes to the Server Name or Icon.

🛠️ Prerequisites

Node.js (v16.9.0 or higher)

A Discord Bot Token

Privileged Intents Enabled (See Setup below)

🚀 Installation & Setup

Clone the repository

git clone [https://github.com/YourUsername/Your-Repo-Name.git](https://github.com/YourUsername/Your-Repo-Name.git)
cd Your-Repo-Name


Install Dependencies

npm install


Configure Environment Variables

Rename .env.example to .env (or create a new file named .env).

Fill in your details:

DISCORD_TOKEN=your_bot_token_here
MOD_CHANNEL_ID=channel_id_for_tickets
LOG_CHANNEL_ID=channel_id_for_logs


Start the Bot

node index.js


⚠️ Important: Developer Portal Settings

For this bot to function correctly, you MUST enable the following settings in the Discord Developer Portal:

Go to Bot -> Privileged Gateway Intents.

Enable ALL of the following:

✅ Presence Intent

✅ Server Members Intent (Required for Mass DM & Logs)

✅ Message Content Intent (Required to read DMs)

Invite Permissions:
When generating the invite link, ensure you select:

Scopes: bot, application.commands

Permissions: Administrator

📖 Usage

Modmail

User: Simply sends a DM to the bot.

Staff: Replies to the embed in the MOD_CHANNEL to respond.

Close Ticket: Reply with !close to end the session.

Announcements

Run /announce in any channel.

Fill out the Title and Content.

Choose whether to DM everyone (True/False).

🚨 Disclaimer regarding Mass DMs

The Mass DM feature sends a direct message to every member of your server.

Use with caution. Sending unsolicited DMs to thousands of users can get your bot flagged by Discord for spam.

Recommended for small/medium communities or critical alerts only.

📝 License

This project is open-source and available for personal use.
