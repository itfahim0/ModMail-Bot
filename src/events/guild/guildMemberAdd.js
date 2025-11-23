import { Events } from 'discord.js';
import { db } from '../../database/index.js';

export default {
    name: Events.GuildMemberAdd,
    async execute(member) {
        // --- CONFIGURATION ---
        const AUTO_ROLE_ID = db.config?.autoRole || process.env.AUTO_ROLE_ID;
        const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID;
        const RULES_CHANNEL_ID = process.env.RULES_CHANNEL_ID;
        const GENERAL_CHANNEL_ID = process.env.GENERAL_CHANNEL_ID;

        // --- STEP 1: Assign the Role ---
        if (AUTO_ROLE_ID) {
            try {
                const role = member.guild.roles.cache.get(AUTO_ROLE_ID);
                if (role) {
                    await member.roles.add(role);
                    console.log(`✅ Assigned role ${role.name} to ${member.user.tag}`);
                } else {
                    console.error(`❌ Role ID ${AUTO_ROLE_ID} not found.`);
                }
            } catch (error) {
                console.error(`❌ Error assigning role to ${member.user.tag}:`, error);
            }
        }

        // --- STEP 2: Send the Welcome Message (Channel) ---
        if (WELCOME_CHANNEL_ID) {
            try {
                const channel = await member.guild.channels.fetch(WELCOME_CHANNEL_ID);
                if (channel && channel.isTextBased()) {
                    const messageToSend = `Hello ${member.user}

                         🎉 WELCOME TO 🎉
                         Purrfect Universe              


We're thrilled to have you join our UNIVERSE! You've been granted the ${AUTO_ROLE_ID ? `<@&${AUTO_ROLE_ID}>` : 'Member'} role.

To get started, please check out these channels:

| **${RULES_CHANNEL_ID ? `<#${RULES_CHANNEL_ID}>` : '#rules'}** : Read this first! It covers our Universe guidelines.,

| **${GENERAL_CHANNEL_ID ? `<#${GENERAL_CHANNEL_ID}>` : '#general'}** : Say hello to Universe member!

Enjoy your stay!
https://discord.gg/xYZHkQYt5H
      Arafat_Zahan
Founder & Universe Architect -
Purrfect Universe 
📧 arafat@purrfecthq.com  🌐 www.purrfecthq.com
Work Hard. Play Hard. Purr Loudest.`;

                    await channel.send(messageToSend);
                    console.log(`✅ Sent welcome message to ${member.user.tag} in #${channel.name}`);
                }
            } catch (error) {
                console.error(`❌ Error sending welcome message:`, error);
            }
        }

        // --- STEP 3: Send DM to User ---
        try {
            await member.send(`Welcome to **${member.guild.name}**! 🎉\n\nWe are thrilled to have you here. Please make sure to check out ${RULES_CHANNEL_ID ? `<#${RULES_CHANNEL_ID}>` : 'our rules'} and say hello in ${GENERAL_CHANNEL_ID ? `<#${GENERAL_CHANNEL_ID}>` : 'general chat'}!\n\nEnjoy your stay!`);
        } catch (err) {
            console.log(`❌ Could not DM ${member.user.tag} (DMs likely closed).`);
        }

        // --- STEP 4: Log to Log Channel ---
        const logChannelId = process.env.LOG_CHANNEL_ID;
        if (logChannelId) {
            try {
                const logChannel = await member.guild.channels.fetch(logChannelId);
                if (logChannel) {
                    const { EmbedBuilder } = await import('discord.js');
                    const embed = new EmbedBuilder()
                        .setColor('#57F287')
                        .setAuthor({
                            name: `${member.user.tag} joined the server`,
                            iconURL: member.user.displayAvatarURL()
                        })
                        .setDescription(`Account created: <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`)
                        .setFooter({ text: `User ID: ${member.id}` })
                        .setTimestamp();

                    await logChannel.send({ embeds: [embed] });
                }
            } catch (error) {
                console.error('Error logging member join:', error);
            }
        }
    }
};