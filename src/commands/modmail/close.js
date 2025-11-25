import { SlashCommandBuilder, PermissionFlagsBits, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('close')
        .setDescription('Close a ticket')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for closing')
                .setRequired(false)),

    async execute(interaction) {
        // Ensure this is a ticket channel
        if (!interaction.channel.name.startsWith('ticket-')) {
            return interaction.reply({ content: '❌ This command can only be used in ticket channels.', ephemeral: true });
        }

        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Send confirmation button
        const confirmButton = new ButtonBuilder()
            .setCustomId('confirm_close')
            .setLabel('Confirm Close')
            .setStyle(ButtonStyle.Danger);
        const row = new ActionRowBuilder().addComponents(confirmButton);

        await interaction.reply({
            content: `✅ Click the button below to confirm closing this ticket.\n**Reason:** ${reason}`,
            components: [row],
            ephemeral: true,
        });
    },
};