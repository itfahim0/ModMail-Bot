# Deploying ModMail Bot (Node.js version)

## Prerequisites on the remote server
- Windows Server (or any OS) with **Node.js v18+** and **npm** installed.
- Ability to run PowerShell/Bash scripts (the `start.sh` works on Linux/macOS; on Windows you can run it via Git Bash or WSL, or simply use the `pm2` command directly).
- (Optional) **PM2** installed globally to keep the bot running as a background service:
  ```
  npm install -g pm2
  ```

## Files added for deployment
- `deploy/start.sh` – Installs dependencies (`npm ci`) and starts the bot (`npm start`).
- `pm2.config.js` – PM2 process file that runs `index.js` in production mode.

## Deployment steps
1. **Copy the repository** to the remote server (e.g., via Git, SCP, or zip upload).
2. Place the `.env` file on the server with all required environment variables (Bot token, Mongo URI, etc.).
3. Open a terminal on the server and navigate to the project root:
   ```
   cd "D:/Discord Bots/ModMail"
   ```
4. **Option A – Quick start (no PM2):**
   ```bash
   ./deploy/start.sh
   ```
   This will install dependencies and launch the bot in the foreground.
5. **Option B – Run as a service with PM2:**
   ```bash
   # Install PM2 globally if not already installed
   npm install -g pm2

   # Start the bot using the PM2 config
   pm2 start pm2.config.js

   # Save the process list so it restarts on reboot
   pm2 save
   # (Windows) Register PM2 as a startup service
   pm2 startup
   ```
   PM2 will keep the bot alive, restart it on crashes, and you can manage it with `pm2 status`, `pm2 stop modmail-bot`, etc.

## Verifying the bot is running
- Check the console output for a successful login message.
- In Discord, test the ModMail commands.
- Use `pm2 logs modmail-bot` (if using PM2) to view live logs.

---
*Feel free to adjust the paths if your server uses a different drive or directory layout.*
