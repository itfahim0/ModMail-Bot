require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    EmbedBuilder, 
    ChannelType 
} = require('discord.js');

// Initialize Client with necessary permissions (Intents)
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [
        Partials.Channel, // Required to receive DMs
        Partials.Message
    ]
});

const MOD_CHANNEL_ID = process.env.MOD_CHANNEL_ID;

client.once('ready', () => {
    console.log(`✅ ${client.user.tag} is online and listening for DMs!`);
    console.log(`📨 Forwarding mail to channel ID: ${MOD_CHANNEL_ID}`);
});

client.on('messageCreate', async (message) => {
    // Ignore messages from bots (including itself)
    if (message.author.bot) return;

    // ---------------------------------------------------------
    // SCENARIO 1: User DMs the Bot -> Forward to Mod Channel
    // ---------------------------------------------------------
    if (message.channel.type === ChannelType.DM) {
        try {
            const modChannel = await client.channels.fetch(MOD_CHANNEL_ID);
            if (!modChannel) {
                console.error('Mod channel not found. Check ID in .env');
                return;
            }

            // Create an Embed to make it look nice and store User Data
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setAuthor({ 
                    name: `${message.author.tag} (${message.author.id})`, 
                    iconURL: message.author.displayAvatarURL() 
                })
                .setDescription(message.content || '*No text content (Attachment only)*')
                .setFooter({ text: `User ID: ${message.author.id}` }) // CRITICAL: Used to reply later
                .setTimestamp();

            // Handle Attachments (Images, files)
            const files = message.attachments.map(a => a.url);

            await modChannel.send({ 
                content: "📨 **New Modmail**", 
                embeds: [embed], 
                files: files 
            });

            // Add a reaction to the user's DM so they know it was sent
            await message.react('✅');

        } catch (error) {
            console.error('Error forwarding DM:', error);
            message.reply('❌ An error occurred while sending your message to the moderators.');
        }
    }

    // ---------------------------------------------------------
    // SCENARIO 2: Mod Replies in Channel -> Forward to User DM
    // ---------------------------------------------------------
    else if (message.channel.id === MOD_CHANNEL_ID) {
        
        // Logic: To reply to a user, the Mod MUST use Discord's "Reply" feature
        // on the bot's embed. This links the messages.
        if (message.reference && message.reference.messageId) {
            try {
                // Fetch the message the Mod replied to
                const originalMessage = await message.channel.messages.fetch(message.reference.messageId);

                // Validations to ensure we are replying to a ticket
                if (originalMessage.author.id !== client.user.id) return; // Only handle replies to the bot
                if (originalMessage.embeds.length === 0) return; // Needs an embed

                // Extract User ID from the Footer of the embed we created earlier
                const footerText = originalMessage.embeds[0].footer?.text;
                if (!footerText || !footerText.includes('User ID:')) return;

                const userId = footerText.split('User ID: ')[1];
                
                // Fetch the user to send DM
                const user = await client.users.fetch(userId);

                // Prepare Embed for the user
                const replyEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setAuthor({ name: `Response from ${message.guild.name} Staff` })
                    .setDescription(message.content || '*Attachment only*')
                    .setTimestamp();

                const files = message.attachments.map(a => a.url);

                await user.send({ embeds: [replyEmbed], files: files });
                
                // React to Mod's message to confirm sent
                await message.react('📤');

            } catch (error) {
                console.error('Error replying to user:', error);
                message.reply('❌ Could not DM user. They may have blocked DMs or the ID could not be parsed.');
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);