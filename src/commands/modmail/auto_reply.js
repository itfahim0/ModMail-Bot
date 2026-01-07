import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('auto-reply')
        .setDescription('Send a canned response')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(opt =>
            opt.setName('key')
                .setDescription('Response key')
                .setRequired(true)
                .addChoices(
                    { name: 'Help', value: 'help' },
                    { name: 'Info', value: 'info' }
                )),

    async execute(interaction) {
        await interaction.reply({ content: "This command is temporarily disabled.", ephemeral: true });
    },
};
