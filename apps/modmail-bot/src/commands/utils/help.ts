import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('List all available commands')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#0099FF')
            .setTitle('🤖 Bot Commands')
            .setDescription('Here are the available commands:')
            .addFields(
                {
                    name: '🛡️ Admin',
                    value: '`/announce`, `/autorole`, `/config`, `/giveaway`, `/panel`, `/modmail-setup`',
                },
                {
                    name: '🔨 Moderation',
                    value: '`/ban`, `/kick`, `/mute`, `/unmute`, `/warn`, `/unwarn`, `/unban`, `/history`, `/case`',
                },
                { name: '📨 ModMail', value: '`/reply`, `/close`, `/claim`, `/transcript`' },
                { name: '🎉 Fun/Utils', value: '`/avatar`, `/meme`, `/ping`, `/stats`' },
            )
            .setFooter({ text: 'Restricted to Administrators' });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
