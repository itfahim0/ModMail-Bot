import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const commands = [];
const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Loading commands...');
const folders = fs.readdirSync(path.join(__dirname, 'src/commands')).filter(f => !f.endsWith('.js'));
for (const folder of folders) {
    const files = fs.readdirSync(path.join(__dirname, 'src/commands', folder)).filter(file => file.endsWith('.js'));
    for (const file of files) {
        try {
            const command = await import(`./src/commands/${folder}/${file}`);
            if (command.default && command.default.data) {
                commands.push(command.default.data.toJSON());
                console.log(`✓ Loaded: ${folder}/${file}`);
            }
        } catch (error) {
            console.error(`✗ Failed to load ${folder}/${file}:`, error.message);
        }
    }
}

console.log(`\nTotal commands loaded: ${commands.length}`);

if (!process.env.DISCORD_TOKEN) {
    console.error('\n❌ DISCORD_TOKEN is not set in .env file');
    process.exit(1);
}
if (!process.env.CLIENT_ID) {
    console.error('\n❌ CLIENT_ID is not set in .env file');
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`\nStarted refreshing ${commands.length} application (/) commands...`);
        if (process.env.GUILD_ID) {
            await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
            console.log(`✅ Successfully registered ${commands.length} commands to guild ${process.env.GUILD_ID}`);
        } else {
            await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
            console.log(`✅ Successfully registered ${commands.length} commands globally`);
        }
    } catch (error) {
        console.error('\n❌ Error deploying commands:');
        console.error(error);
        process.exit(1);
    }
})();