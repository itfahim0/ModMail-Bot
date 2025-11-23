import { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Make an announcement')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to send announcement')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('mentions')
                .setDescription('Mentions (e.g., @everyone, @here, or role IDs)')
                .setRequired(false)),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const mentions = interaction.options.getString('mentions') || '';

        // Show modal for announcement content
        const modal = new ModalBuilder()
            .setCustomId(`announce_modal_${channel.id}_${mentions}`)
            .setTitle('Create Announcement');

        const titleInput = new TextInputBuilder()
            .setCustomId('announce_title')
            .setLabel('Announcement Title')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(256);

        const messageInput = new TextInputBuilder()
            .setCustomId('announce_message')
            .setLabel('Announcement Message')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(4000);

        const colorInput = new TextInputBuilder()
            .setCustomId('announce_color')
            .setLabel('Embed Color (hex code, e.g., #FF0000)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue('#FF0000')
            .setMaxLength(7);

        const firstRow = new ActionRowBuilder().addComponents(titleInput);
        const secondRow = new ActionRowBuilder().addComponents(messageInput);
        const thirdRow = new ActionRowBuilder().addComponents(colorInput);

        modal.addComponents(firstRow, secondRow, thirdRow);

        await interaction.showModal(modal);
    }
};