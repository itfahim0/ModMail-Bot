import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
    console.error('❌ Missing DISCORD_TOKEN or CLIENT_ID in .env');
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('🗑️  Clearing all commands...');

        if (process.env.GUILD_ID) {
            // Clear guild commands
            await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: [] });
            console.log('✅ Successfully cleared all guild commands');
        } else {
            // Clear global commands
            await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });
            console.log('✅ Successfully cleared all global commands');
        }

        console.log('\n✅ All commands cleared! Now run: node deploy.js');
    } catch (error) {
        console.error('❌ Error clearing commands:');
        console.error(error);
        process.exit(1);
    }
})();
