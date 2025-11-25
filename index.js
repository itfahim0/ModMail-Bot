import { Client, GatewayIntentBits, Collection, Partials, Events } from 'discord.js';
import dotenv from 'dotenv';
import { connectDB } from './src/database/index.js';
import { loadCommands } from './src/commands/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildInvites
    ],
    partials: [Partials.Channel, Partials.Message]
});

client.commands = new Collection();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Event Loader
const loadEvents = async () => {
    const folders = fs.readdirSync(path.join(__dirname, 'src/events'));
    for (const folder of folders) {
        const files = fs.readdirSync(path.join(__dirname, 'src/events', folder)).filter(file => file.endsWith('.js'));
        for (const file of files) {
            const event = await import(`./src/events/${folder}/${file}`);
            if (event.default.once) client.once(event.default.name, (...args) => event.default.execute(...args));
            else client.on(event.default.name, (...args) => event.default.execute(...args));
        }
    }
};

(async () => {
    await connectDB(); // Loads data.json
    await loadCommands(client);
    await loadEvents();

    // Initialize Storage & Worker
    const { storage } = await import('./src/storage/jsonAdapter.js');
    await storage.init();

    const { DmWorker } = await import('./src/workers/dmSender.js');
    const worker = new DmWorker(client);

    client.once(Events.ClientReady, () => {
        worker.start();
    });

    if (process.env.DISCORD_TOKEN) {
        client.login(process.env.DISCORD_TOKEN);
    } else {
        console.log('⚠️ No DISCORD_TOKEN found in .env');
    }
})();
