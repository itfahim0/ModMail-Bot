import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('dm')
        .setDescription('Send a direct message to a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to DM')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to send')
                .setRequired(true)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const messageContent = interaction.options.getString('message');

        try {
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setAuthor({ name: `Message from ${interaction.guild.name}`, iconURL: interaction.guild.iconURL() })
                .setDescription(messageContent)
                .setFooter({ text: `Sent by ${interaction.user.tag}` })
                .setTimestamp();

            await targetUser.send({ embeds: [embed] });

            await interaction.reply({
                content: `✅ Successfully sent DM to **${targetUser.tag}**.`,
                ephemeral: true
            });
        } catch (error) {
            console.error('DM Error:', error);
            await interaction.reply({
                content: `❌ Could not send DM to **${targetUser.tag}**. They may have DMs disabled.`,
                ephemeral: true
            });
        }
    },
};
