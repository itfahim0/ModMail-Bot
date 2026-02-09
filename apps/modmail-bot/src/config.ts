import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
    DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required'),
    DISCORD_GUILD_ID: z.string().optional(),
    MODMAIL_LOG_CHANNEL_ID: z.string().optional(),
    MODMAIL_CATEGORY_ID: z.string().optional(),
    APP_PORT: z.string().default('3001'),
    EXTERNAL_API_URL: z.string().default('http://localhost:3001'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error(
        '❌ Invalid environment variables:',
        JSON.stringify(_env.error.format(), null, 2),
    );
    process.exit(1);
}

export const config = {
    discordToken: _env.data.DISCORD_TOKEN,
    guildId: _env.data.DISCORD_GUILD_ID,
    logChannelId: _env.data.MODMAIL_LOG_CHANNEL_ID,
    categoryId: _env.data.MODMAIL_CATEGORY_ID,
    port: parseInt(_env.data.APP_PORT, 10),
    externalApiUrl: _env.data.EXTERNAL_API_URL,
};
