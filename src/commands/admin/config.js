import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { db, saveDB } from '../../database/index.js';

export default {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure bot settings')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('setting')
                .setDescription('Setting to change')
                .setRequired(true)
                .addChoices(
                    { name: 'Prefix', value: 'prefix' },
                    { name: 'Welcome Message', value: 'welcome_msg' }
                ))
        .addStringOption(option =>
            option.setName('value')
                .setDescription('New value')
                .setRequired(true)),

    async execute(interaction) {
        const setting = interaction.options.getString('setting');
        const value = interaction.options.getString('value');

        if (!db.config) db.config = {};

        db.config[setting] = value;
        saveDB();

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('⚙️ Configuration Updated')
            .addFields(
                { name: 'Setting', value: setting, inline: true },
                { name: 'New Value', value: value, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};