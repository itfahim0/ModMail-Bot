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
                    const serverName = member.guild.name;

                    const messageToSend = `Hello ${member.user} 👋

                         **🎉 WELCOME TO 🎉**

 \`\`\`
     ${serverName}
\`\`\`

We're thrilled to have you join our UNIVERSE !${AUTO_ROLE_ID ? ` You've been granted the <@&${AUTO_ROLE_ID}> role.` : ''}

To get started, please check out these channels:

| 🌍 **Purrfect Universe** - ${RULES_CHANNEL_ID ? `<#${RULES_CHANNEL_ID}>` : '#rules'} : Read this first! It covers our Universe guidelines.,

| 🌍 **Purrfect Universe** - ${GENERAL_CHANNEL_ID ? `<#${GENERAL_CHANNEL_ID}>` : '#general'} : Say hello to Universe member !

Enjoy your stay!

https://discord.gg/xYZHkQYt5H

**Arafat_Zahan**
Founder & Universe Architect -
**Purrfect Universe**
📧 arafat@purrfecthq.com
🌐 www.purrfecthq.com
✨ **Work Hard. Play Hard. Purr Loudest.** ✨`;

                    await channel.send(messageToSend);
                    console.log(`✅ Sent welcome message to ${member.user.tag} in #${channel.name}`);
                }
            } catch (error) {
                console.error(`❌ Error sending welcome message:`, error);
            }
        }

        // --- STEP 3: Send DM to the new member ---
        try {
            const dmMessage = `Hello ${member.user} 👋

                                **🎉 WELCOME TO 🎉**

\`\`\`
     ${member.guild.name}
\`\`\`

We're thrilled to have you join our UNIVERSE !${AUTO_ROLE_ID ? ` You've been granted the <@&${AUTO_ROLE_ID}> role.` : ''}

To get started, please check out these channels:

| 🌍 **Purrfect Universe** - ${RULES_CHANNEL_ID ? `<#${RULES_CHANNEL_ID}>` : '#rules'} : Read this first! It covers our Universe guidelines.,

| 🌍 **Purrfect Universe** - ${GENERAL_CHANNEL_ID ? `<#${GENERAL_CHANNEL_ID}>` : '#general'} : Say hello to Universe member !

Enjoy your stay!

https://discord.gg/xYZHkQYt5H

**Arafat_Zahan**
Founder & Universe Architect -
**Purrfect Universe**
📧 arafat@purrfecthq.com
🌐 www.purrfecthq.com
✨ **Work Hard. Play Hard. Purr Loudest.** ✨`;

            await member.send(dmMessage);
            console.log(`✅ Sent welcome DM to ${member.user.tag}`);
        } catch (error) {
            console.error(`❌ Could not send DM to ${member.user.tag}:`, error.message);
        }
    }
};