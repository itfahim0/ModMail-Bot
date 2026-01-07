import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Unlock the current channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            SendMessages: null, // Reset to default (inherit) or true
        });

        await interaction.reply({ content: '🔓 Channel unlocked successfully.', ephemeral: true });
        await interaction.channel.send('🔓 **This channel has been unlocked.**');
    },
};
