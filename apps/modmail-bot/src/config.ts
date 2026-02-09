import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
    DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required'),
    GUILD_ID: z.string().optional(),
    LOG_CHANNEL_ID: z.string().optional(),
    MODMAIL_CATEGORY_ID: z.string().optional(),
    MOD_CHANNEL_ID: z.string().optional(),
    WELCOME_CHANNEL_ID: z.string().optional(),
    RULES_CHANNEL_ID: z.string().optional(),
    GENERAL_CHANNEL_ID: z.string().optional(),
    AUTO_ROLE_ID: z.string().optional(),
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
    guildId: _env.data.GUILD_ID,
    logChannelId: _env.data.LOG_CHANNEL_ID,
    categoryId: _env.data.MODMAIL_CATEGORY_ID,
    modChannelId: _env.data.MOD_CHANNEL_ID,
    welcomeChannelId: _env.data.WELCOME_CHANNEL_ID,
    rulesChannelId: _env.data.RULES_CHANNEL_ID,
    generalChannelId: _env.data.GENERAL_CHANNEL_ID,
    autoRoleId: _env.data.AUTO_ROLE_ID,
    port: parseInt(_env.data.APP_PORT, 10),
    externalApiUrl: _env.data.EXTERNAL_API_URL,
};
