#!/usr/bin/env bash
# start.sh – launch the ModMail bot
# This script assumes Node.js (v18+) and npm are installed on the server.
# It installs dependencies and starts the bot.

# Move to the directory containing this script (the bot root)
cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Install exact dependencies (clean install)
npm ci

# Start the bot (uses the "start" script from package.json)
npm start "$@"
