import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { db, saveDB } from '../../database/index.js';

export default {
    data: new SlashCommandBuilder()
        .setName('unwarn')
        .setDescription('Remove a warning from a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to unwarn')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('index')
                .setDescription('Warning number to remove (from /history)')
                .setRequired(true)),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const index = interaction.options.getInteger('index') - 1;

        if (!db.users[user.id] || !db.users[user.id].warnings || db.users[user.id].warnings.length === 0) {
            return interaction.reply({ content: '❌ This user has no warnings.', ephemeral: true });
        }

        if (index < 0 || index >= db.users[user.id].warnings.length) {
            return interaction.reply({ content: '❌ Invalid warning number.', ephemeral: true });
        }

        const removed = db.users[user.id].warnings.splice(index, 1)[0];
        saveDB();

        const embed = new EmbedBuilder()
            .setColor('#57F287')
            .setTitle('🗑️ Warning Removed')
            .setDescription(`Removed warning #${index + 1} from ${user.tag}`)
            .addFields({ name: 'Original Reason', value: removed.reason })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
