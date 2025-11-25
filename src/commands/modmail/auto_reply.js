// src/commands/modmail/auto_reply.js
import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { t } from '../../utils/i18n.js';

export default {
    data: new SlashCommandBuilder()
        .setName('auto-reply')
        .setDescription('Send a canned response')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addStringOption(opt =>
            opt.setName('key')
                .setDescription('Response key')
                .setRequired(true)
                .addChoices(
                    { name: 'Help', value: 'help' },
                    { name: 'Info', value: 'info' }
                )),

    async execute(interaction) {
        const key = interaction.options.getString('key');
        const responses = {
            help: t('auto_reply_help'),
            info: t('auto_reply_info'),
        };
        const reply = responses[key] || t('auto_reply_default');
        const embed = new EmbedBuilder()
            .setColor('#00AAFF')
            .setDescription(reply);
        await interaction.reply({ embeds: [embed] });
    },
};
