import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
    console.error('Missing environment variables.');
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('🗑️ Deleting all commands...');

        // Delete Global Commands
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });
        console.log('✅ Deleted all global commands.');

        // Delete Guild Commands (if GUILD_ID is set)
        if (process.env.GUILD_ID) {
            await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: [] });
            console.log(`✅ Deleted all guild commands for ${process.env.GUILD_ID}.`);
        }

        console.log('🎉 Cleanup complete! Now run "node deploy.js" to register fresh commands.');
    } catch (error) {
        console.error('Error deleting commands:', error);
    }
})();
