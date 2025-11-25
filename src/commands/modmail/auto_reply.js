// src/commands/modmail/auto_reply.js - v1.1 fixed
import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

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
            help: "Here is how you can use the bot...",
            info: "This bot is designed to help you with...",
        };
        const reply = responses[key] || "I'm not sure what you mean.";
        const embed = new EmbedBuilder()
            .setColor('#00AAFF')
            .setDescription(reply);
        await interaction.reply({ embeds: [embed] });
    },
};
