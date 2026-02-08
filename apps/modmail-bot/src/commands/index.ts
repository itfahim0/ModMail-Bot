import {
    ChatInputCommandInteraction,
    Collection,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { logger } from '../logging/logger.js';
import setupCommand from './modmail/setup.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Global accessible commands collection
export const commandsCollection = new Collection<string, any>();

// Array for REST deployment
export const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];

export const loadCommands = async () => {
    // Manually add setup command for now to ensure it works
    if (setupCommand?.data) {
        commandsCollection.set(setupCommand.data.name, setupCommand);
        commands.push(setupCommand.data.toJSON());
    }

    // Dynamic load
    const folders = fs
        .readdirSync(__dirname)
        .filter((f) => !f.endsWith('.js') && !f.endsWith('.ts'));

    for (const folder of folders) {
        const folderPath = path.join(__dirname, folder);
        if (!fs.statSync(folderPath).isDirectory()) continue;

        const files = fs
            .readdirSync(folderPath)
            .filter((file) => file.endsWith('.js') || file.endsWith('.ts'));

        for (const file of files) {
            try {
                const filePath = `file://${path.join(folderPath, file)}`;
                const commandModule = await import(filePath);
                const command = commandModule.default || commandModule;

                if (command?.data && command?.execute) {
                    commandsCollection.set(command.data.name, command);
                    commands.push(command.data.toJSON());
                    logger.info(`Loaded command: ${command.data.name}`);
                }
            } catch (error) {
                logger.error(`Failed to load command ${file}:`, error);
            }
        }
    }
};

export async function handleSlashCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const command = commandsCollection.get(interaction.commandName);

    if (!command) {
        logger.warn(`Unknown command received: ${interaction.commandName}`);
        await interaction.reply({
            content: `Unknown command: ${interaction.commandName}`,
            ephemeral: true,
        });
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        logger.error(`Error executing command ${interaction.commandName}:`, error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: 'There was an error while executing this command!',
                ephemeral: true,
            });
        } else {
            await interaction.reply({
                content: 'There was an error while executing this command!',
                ephemeral: true,
            });
        }
    }
}
