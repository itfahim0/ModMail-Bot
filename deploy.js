import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const commands = [];
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const folders = fs.readdirSync(path.join(__dirname, 'src/commands')).filter(f => !f.endsWith('.js'));
for (const folder of folders) {
    const files = fs.readdirSync(path.join(__dirname, 'src/commands', folder)).filter(file => file.endsWith('.js'));
    for (const file of files) {
        const command = await import(`./src/commands/${folder}/${file}`);
        if (command.default && command.default.data) {
            commands.push(command.default.data.toJSON());
        }
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);
        if (process.env.GUILD_ID) {
            await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
        } else {
            await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        }
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();