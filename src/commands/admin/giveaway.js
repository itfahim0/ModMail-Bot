import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Start a giveaway')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('prize')
                .setDescription('Prize to win')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('time')
                .setDescription('Duration (e.g., 10m, 1h, 1d)')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('winners')
                .setDescription('Number of winners')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Additional message')
                .setRequired(false)),

    async execute(interaction) {
        const prize = interaction.options.getString('prize');
        const timeStr = interaction.options.getString('time');
        const winnersCount = interaction.options.getInteger('winners');
        const message = interaction.options.getString('message') || 'Good luck!';

        // Parse time
        let duration = 0;
        const unit = timeStr.slice(-1);
        const value = parseInt(timeStr.slice(0, -1));

        if (unit === 'm') duration = value * 60 * 1000;
        else if (unit === 'h') duration = value * 60 * 60 * 1000;
        else if (unit === 'd') duration = value * 24 * 60 * 60 * 1000;
        else return interaction.reply({ content: '❌ Invalid time format. Use m/h/d (e.g., 10m, 1h)', ephemeral: true });

        const endTime = Date.now() + duration;

        const embed = new EmbedBuilder()
            .setColor('#FF00FF')
            .setTitle('🎉 GIVEAWAY 🎉')
            .setDescription(`**Prize:** ${prize}\n**Ends:** <t:${Math.floor(endTime / 1000)}:R>\n**Winners:** ${winnersCount}\n\n${message}\n\nReact with 🎉 to enter!`)
            .setFooter({ text: `Hosted by ${interaction.user.tag}` })
            .setTimestamp(endTime);

        const giveawayMsg = await interaction.reply({ embeds: [embed], fetchReply: true });
        await giveawayMsg.react('🎉');

        setTimeout(async () => {
            const fetchedMsg = await interaction.channel.messages.fetch(giveawayMsg.id).catch(() => null);
            if (!fetchedMsg) return;

            const reactions = fetchedMsg.reactions.cache.get('🎉');
            const users = await reactions.users.fetch();
            const validUsers = users.filter(u => !u.bot);

            if (validUsers.size === 0) {
                return interaction.followUp('No one entered the giveaway 😢');
            }

            const winners = validUsers.random(Math.min(winnersCount, validUsers.size));
            const winnerString = Array.isArray(winners) ? winners.map(w => w.toString()).join(', ') : winners.toString();

            const endEmbed = new EmbedBuilder()
                .setColor('#000000')
                .setTitle('🎉 GIVEAWAY ENDED 🎉')
                .setDescription(`**Prize:** ${prize}\n**Winner(s):** ${winnerString}`)
                .setTimestamp();

            await fetchedMsg.reply({ content: `Congratulations ${winnerString}! You won **${prize}**!`, embeds: [endEmbed] });
        }, duration);
    }
};