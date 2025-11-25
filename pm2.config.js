// pm2.config.js – PM2 process file for ModMail bot
module.exports = {
    apps: [
        {
            name: "modmail-bot",
            script: "index.js",
            cwd: __dirname, // project root
            interpreter: "node",
            watch: false,
            env: {
                NODE_ENV: "production",
            },
            // Restart on crash
            restart_delay: 5000,
        },
    ],
};
