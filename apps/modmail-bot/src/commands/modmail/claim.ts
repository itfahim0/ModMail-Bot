import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('claim')
        .setDescription('Claim a ticket')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        if (!interaction.channel.name.startsWith('ticket-')) {
            return interaction.reply({
                content: '❌ This command can only be used in ticket channels.',
                ephemeral: true,
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#FEE75C')
            .setDescription(`📌 Ticket claimed by ${interaction.user}`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        await interaction.channel.setTopic(
            `${interaction.channel.topic} | Claimed by ${interaction.user.tag}`,
        );
    },
};
