import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

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
        if (!interaction.channel.name.startsWith('ticket-')) {
            return interaction.reply({ content: '❌ This command can only be used in ticket channels.', ephemeral: true });
        }

        const reason = interaction.options.getString('reason') || 'No reason provided';
        const userId = interaction.channel.topic.match(/\((\d+)\)/)?.[1];

        if (userId) {
            try {
                const user = await interaction.client.users.fetch(userId);
                await user.send({
                    embeds: [new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('🔒 Ticket Closed')
                        .setDescription(`Your ticket has been closed by staff.\n**Reason:** ${reason}`)
                        .setTimestamp()]
                });
            } catch (error) {
                console.error('Could not DM user:', error);
            }
        }

        await interaction.reply('✅ Ticket closed. Deleting channel in 5 seconds...');
        setTimeout(() => interaction.channel.delete().catch(() => { }), 5000);
    }
};