import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('reply')
        .setDescription('Reply to a ticket user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption((option) =>
            option.setName('message').setDescription('Message to send').setRequired(true),
        ),

    async execute(interaction) {
        if (!interaction.channel.name.startsWith('ticket-')) {
            return interaction.reply({
                content: '❌ This command can only be used in ticket channels.',
                ephemeral: true,
            });
        }

        const message = interaction.options.getString('message');
        const userId = interaction.channel.topic.match(/\((\d+)\)/)?.[1];

        if (!userId) {
            return interaction.reply({
                content: '❌ Could not find user ID in channel topic.',
                ephemeral: true,
            });
        }

        try {
            const user = await interaction.client.users.fetch(userId);
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setAuthor({ name: 'Staff Reply', iconURL: interaction.user.displayAvatarURL() })
                .setDescription(message)
                .setTimestamp();

            await user.send({ embeds: [embed] });

            const confirmEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setAuthor({
                    name: interaction.user.tag,
                    iconURL: interaction.user.displayAvatarURL(),
                })
                .setDescription(message)
                .setTimestamp();

            await interaction.reply({ embeds: [confirmEmbed] });
        } catch (error) {
            await interaction.reply({
                content: `❌ Failed to send message: ${error.message}`,
                ephemeral: true,
            });
        }
    },
};
