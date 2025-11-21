require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    EmbedBuilder, 
    ChannelType, 
    ActivityType, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder, 
    PermissionFlagsBits,
    AuditLogEvent
} = require('discord.js');

// --- CONFIGURATION ---
const MOD_CHANNEL_ID = process.env.MOD_CHANNEL_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const TOKEN = process.env.DISCORD_TOKEN;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates, 
        GatewayIntentBits.GuildInvites,     
        GatewayIntentBits.GuildPresences    
    ],
    partials: [Partials.Channel, Partials.Message, Partials.GuildMember]
});

// --- COMMANDS ---
const commands = [
    new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Send an announcement (Admin Only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option => 
            option.setName('channel').setDescription('Where to post').setRequired(true)
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
        .addBooleanOption(option => 
            option.setName('dm_everyone').setDescription('Send to every member via DM? (Risky)')),
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} is online!`);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('✅ Commands registered.');
    } catch (error) { console.error('❌ Error registering commands:', error); }
});

// --- INTERACTION HANDLER ---
client.on('interactionCreate', async interaction => {
    // ANNOUNCE COMMAND
    if (interaction.isChatInputCommand() && interaction.commandName === 'announce') {
        const targetChannel = interaction.options.getChannel('channel');
        const dmEveryone = interaction.options.getBoolean('dm_everyone') || false;

        const modal = new ModalBuilder()
            .setCustomId(`announce_modal|${targetChannel.id}|${dmEveryone}`)
            .setTitle('Create Announcement');

        const titleInput = new TextInputBuilder().setCustomId('ann_title').setLabel("Title").setStyle(TextInputStyle.Short).setRequired(true);
        const contentInput = new TextInputBuilder().setCustomId('ann_content').setLabel("Message").setStyle(TextInputStyle.Paragraph).setRequired(true);
        // Treat this field mainly for Pings now
        const footerInput = new TextInputBuilder().setCustomId('ann_footer').setLabel("Mentions (e.g. @everyone)").setStyle(TextInputStyle.Short).setRequired(false);

        modal.addComponents(
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(contentInput),
            new ActionRowBuilder().addComponents(footerInput)
        );
        await interaction.showModal(modal);
    }

    // MODAL SUBMIT
    if (interaction.isModalSubmit() && interaction.customId.startsWith('announce_modal')) {
        await interaction.deferReply({ ephemeral: true });
        const [prefix, channelId, dmEveryoneString] = interaction.customId.split('|');
        const dmEveryone = dmEveryoneString === 'true';

        const title = interaction.fields.getTextInputValue('ann_title');
        const content = interaction.fields.getTextInputValue('ann_content');
        const mentionText = interaction.fields.getTextInputValue('ann_footer') || ''; 

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle(`📢 ${title}`)
            .setDescription(content)
            .setFooter({ text: 'Management Team', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        try {
            const channel = await interaction.guild.channels.fetch(channelId);
            // Send Pings outside the embed, Embed follows
            await channel.send({ content: mentionText.includes('@') ? mentionText : null, embeds: [embed] });
            
            let msg = `✅ Posted in ${channel}.`;

            if (dmEveryone) {
                msg += `\n🚀 Mass DM started...`;
                (async () => {
                    const members = await interaction.guild.members.fetch();
                    for (const [id, member] of members) {
                        if (member.user.bot) continue;
                        try {
                            await member.send({ content: `📢 **Announcement From Purrfect Universe**`, embeds: [embed] });
                            await new Promise(r => setTimeout(r, 2000));
                        } catch (e) {}
                    }
                })();
            }
            await interaction.editReply({ content: msg });
        } catch (err) { await interaction.editReply({ content: `❌ Error: ${err.message}` }); }
    }
});

// --- MODMAIL ---
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.channel.type === ChannelType.DM) {
        const modChannel = await client.channels.fetch(MOD_CHANNEL_ID).catch(() => null);
        if (modChannel) {
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setDescription(message.content || '*Attachment*')
                .setFooter({ text: `User ID: ${message.author.id}` }).setTimestamp();
            await modChannel.send({ content: "📨 **New Ticket**", embeds: [embed], files: message.attachments.map(a => a.url) });
            await message.react('✅');
        }
    } else if (message.channel.id === MOD_CHANNEL_ID && message.reference) {
        try {
            const original = await message.channel.messages.fetch(message.reference.messageId);
            if (original.author.id === client.user.id && original.embeds.length) {
                const match = original.embeds[0].footer?.text?.match(/User ID:\s+(\d+)/);
                if (match) {
                    const user = await client.users.fetch(match[1]);
                    if (message.content === '!close') {
                        await user.send({ embeds: [new EmbedBuilder().setColor('Red').setTitle('Ticket Closed')] });
                        await message.reply('🔒 Ticket closed.');
                    } else {
                        await user.send({ 
                            embeds: [new EmbedBuilder().setColor('Green').setAuthor({ name: 'Staff Reply' }).setDescription(message.content || '*File*')], 
                            files: message.attachments.map(a => a.url) 
                        });
                        await message.react('📤');
                    }
                }
            }
        } catch (e) { message.reply('❌ Failed to send.'); }
    }
});

// --- HELPER: LOG SENDER ---
const sendLog = async (guild, embed) => {
    if (!LOG_CHANNEL_ID) return;
    try {
        const channel = await guild.channels.fetch(LOG_CHANNEL_ID);
        if (channel) await channel.send({ embeds: [embed] });
    } catch (e) { console.error('Log channel error:', e); }
};

// --- LOGGING (Logo + Name in One Line) ---

// 1. VOICE LOGS
client.on('voiceStateUpdate', async (oldState, newState) => {
    if (oldState.channelId === newState.channelId) return; // Ignore Mute/Deafen

    const user = newState.member.user;
    const embed = new EmbedBuilder().setTimestamp();

    if (!oldState.channelId && newState.channelId) {
        // Join
        embed.setColor('#57F287') // Green
             .setAuthor({ 
                 name: `${user.tag} joined Voice Channel: ${newState.channel.name}`, 
                 iconURL: user.displayAvatarURL() 
             });
    } else if (oldState.channelId && !newState.channelId) {
        // Leave
        embed.setColor('#ED4245') // Red
             .setAuthor({ 
                 name: `${user.tag} left Voice Channel: ${oldState.channel.name}`, 
                 iconURL: user.displayAvatarURL() 
             });
    } else if (oldState.channelId && newState.channelId) {
        // Moved
        embed.setColor('#FEE75C') // Yellow
             .setAuthor({ 
                 name: `${user.tag} moved: ${oldState.channel.name} ➡ ${newState.channel.name}`, 
                 iconURL: user.displayAvatarURL() 
             });
    }
    await sendLog(newState.guild, embed);
});

// 2. INVITE LOGS
client.on('inviteCreate', async (invite) => {
    const embed = new EmbedBuilder()
        .setColor('#5865F2') // Blurple
        .setAuthor({ 
            name: `${invite.inviter?.tag || 'Unknown'} created invite [${invite.code}] for #${invite.channel.name}`, 
            iconURL: invite.inviter?.displayAvatarURL() || null 
        })
        .setTimestamp();
    await sendLog(invite.guild, embed);
});

// 3. SERVER UPDATES
client.on('guildUpdate', async (oldGuild, newGuild) => {
    let executor = null;
    try {
        // Try to find who made the change
        const logs = await newGuild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.GuildUpdate });
        const entry = logs.entries.first();
        if (entry && (Date.now() - entry.createdTimestamp) < 5000) executor = entry.executor;
    } catch (e) { /* Ignore audit errors */ }

    const embed = new EmbedBuilder().setColor('#EB459E').setTimestamp();
    const userText = executor ? `${executor.tag}` : 'Someone';
    const userIcon = executor ? executor.displayAvatarURL() : newGuild.iconURL();

    if (oldGuild.name !== newGuild.name) {
        embed.setAuthor({ 
            name: `${userText} changed Server Name: ${oldGuild.name} ➡ ${newGuild.name}`, 
            iconURL: userIcon 
        });
        await sendLog(newGuild, embed);
    } else if (oldGuild.icon !== newGuild.icon) {
        embed.setAuthor({ 
            name: `${userText} updated Server Icon`, 
            iconURL: userIcon 
        });
        await sendLog(newGuild, embed);
    }
});

client.login(TOKEN);