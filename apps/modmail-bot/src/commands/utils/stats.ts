import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder, version } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Show bot statistics')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime % 60);

        const embed = new EmbedBuilder()
            .setColor('#0099FF')
            .setTitle('📊 Bot Statistics')
            .addFields(
                {
                    name: 'Uptime',
                    value: `${days}d ${hours}h ${minutes}m ${seconds}s`,
                    inline: true,
                },
                { name: 'Users', value: `${interaction.client.users.cache.size}`, inline: true },
                {
                    name: 'Channels',
                    value: `${interaction.client.channels.cache.size}`,
                    inline: true,
                },
                { name: 'Discord.js', value: `v${version}`, inline: true },
                { name: 'Node.js', value: process.version, inline: true },
                {
                    name: 'Memory Usage',
                    value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
                    inline: true,
                },
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
