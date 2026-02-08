// src/commands/index.ts
import {
  Collection
} from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// src/logging/logger.ts
import winston from "winston";
var { combine, timestamp, printf, colorize } = winston.format;
var logFormat = printf(({ level, message, timestamp: timestamp2 }) => {
  return `${timestamp2} [${level}]: ${message}`;
});
var logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), colorize(), logFormat),
  transports: [new winston.transports.Console()]
});

// src/commands/modmail/setup.ts
import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
var setup_default = {
  data: new SlashCommandBuilder().setName("modmail-setup").setDescription("Setup ModMail category").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    try {
      const guild = interaction.guild;
      const category = await guild.channels.create({
        name: "ModMail Tickets",
        type: ChannelType.GuildCategory
      });
      const logChannel = await guild.channels.create({
        name: "modmail-logs",
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          }
        ]
      });
      await interaction.reply({
        content: `\u2705 ModMail Setup Complete!

**Category ID:** \`${category.id}\`
**Log Channel ID:** \`${logChannel.id}\`

Please update your \`.env\` file with these IDs:
\`\`\`env
MODMAIL_CATEGORY_ID=${category.id}
LOG_CHANNEL_ID=${logChannel.id}
\`\`\``,
        ephemeral: true
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: "\u274C Failed to setup ModMail.", ephemeral: true });
    }
  }
};

// src/commands/index.ts
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var commandsCollection = new Collection();
var commands = [];
var loadCommands = async () => {
  if (setup_default?.data) {
    commandsCollection.set(setup_default.data.name, setup_default);
    commands.push(setup_default.data.toJSON());
  }
  const folders = fs.readdirSync(__dirname).filter((f) => !f.endsWith(".js") && !f.endsWith(".ts"));
  for (const folder of folders) {
    const folderPath = path.join(__dirname, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;
    const files = fs.readdirSync(folderPath).filter((file) => file.endsWith(".js") || file.endsWith(".ts"));
    for (const file of files) {
      try {
        const filePath = `file://${path.join(folderPath, file)}`;
        const commandModule = await import(filePath);
        const command = commandModule.default || commandModule;
        if (command?.data && command?.execute) {
          commandsCollection.set(command.data.name, command);
          commands.push(command.data.toJSON());
          logger.info(`Loaded command: ${command.data.name}`);
        }
      } catch (error) {
        logger.error(`Failed to load command ${file}:`, error);
      }
    }
  }
};
async function handleSlashCommand(interaction) {
  const command = commandsCollection.get(interaction.commandName);
  if (!command) {
    logger.warn(`Unknown command received: ${interaction.commandName}`);
    await interaction.reply({
      content: `Unknown command: ${interaction.commandName}`,
      ephemeral: true
    });
    return;
  }
  try {
    await command.execute(interaction);
  } catch (error) {
    logger.error(`Error executing command ${interaction.commandName}:`, error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true
      });
    }
  }
}

// src/config.ts
import dotenv from "dotenv";
import path2 from "path";
import { z } from "zod";
dotenv.config({ path: path2.resolve(process.cwd(), ".env") });
var envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, "DISCORD_TOKEN is required"),
  DISCORD_GUILD_ID: z.string().optional(),
  MODMAIL_LOG_CHANNEL_ID: z.string().optional(),
  MODMAIL_CATEGORY_ID: z.string().optional()
});
var _env = envSchema.safeParse(process.env);
if (!_env.success) {
  console.error(
    "\u274C Invalid environment variables:",
    JSON.stringify(_env.error.format(), null, 2)
  );
  process.exit(1);
}
var config = {
  discordToken: _env.data.DISCORD_TOKEN,
  guildId: _env.data.DISCORD_GUILD_ID,
  logChannelId: _env.data.MODMAIL_LOG_CHANNEL_ID,
  categoryId: _env.data.MODMAIL_CATEGORY_ID
};

// src/discord/client.ts
import { Client, Events, GatewayIntentBits, Partials } from "discord.js";

// src/events/interactionCreate.ts
import { ChannelType as ChannelType2, EmbedBuilder } from "discord.js";
async function handleInteractionCreate(interaction) {
  if (!interaction.isButton()) return;
  if (interaction.customId === "confirm_close") {
    await handleCloseConfirmation(interaction);
  }
}
async function handleCloseConfirmation(interaction) {
  const reasonMatch = interaction.message.content.match(/\*\*Reason:\*\* (.*)/);
  const reason = reasonMatch ? reasonMatch[1] : "No reason provided";
  const channel = interaction.channel;
  if (!channel || channel.type !== ChannelType2.GuildText) return;
  const userId = channel.topic?.match(/\((\d+)\)/)?.[1];
  if (userId) {
    try {
      const user = await interaction.client.users.fetch(userId);
      const embed = new EmbedBuilder().setColor("#FF0000").setTitle("\u{1F512} Ticket Closed").setDescription(`Your ticket has been closed by staff.
**Reason:** ${reason}`).setTimestamp();
      await user.send({ embeds: [embed] });
    } catch (e) {
      logger.error("Failed to DM user on close", {
        error: e instanceof Error ? e.message : String(e)
      });
    }
  }
  if (config.logChannelId) {
    const logChannel = interaction.guild?.channels.cache.get(config.logChannelId);
    if (logChannel) {
      const logEmbed = new EmbedBuilder().setColor("#FF0000").setTitle("Ticket Closed").addFields(
        { name: "Channel", value: channel.name, inline: true },
        { name: "Closed By", value: interaction.user.tag, inline: true },
        { name: "Reason", value: reason }
      ).setTimestamp();
      await logChannel.send({ embeds: [logEmbed] });
    }
  }
  await interaction.update({ content: "\u2705 Ticket will be deleted shortly...", components: [] });
  setTimeout(() => channel.delete().catch(() => {
  }), 5e3);
}

// src/events/messageCreate.ts
import { ChannelType as ChannelType3, EmbedBuilder as EmbedBuilder2, PermissionFlagsBits as PermissionFlagsBits2 } from "discord.js";
async function handleMessageCreate(message) {
  if (message.author.bot) return;
  if (message.channel.type === ChannelType3.DM) {
    await handleDMMessage(message);
    return;
  }
  if (message.guild && config.categoryId && message.channel.type === ChannelType3.GuildText && message.channel.parentId === config.categoryId) {
    await handleStaffReply(message);
  }
}
async function handleDMMessage(message) {
  const guild = message.client.guilds.cache.first();
  if (!guild) return;
  const categoryId = config.categoryId;
  if (!categoryId) {
    await message.reply("\u274C ModMail system is not configured.");
    return;
  }
  const cleanUsername = message.author.username.toLowerCase().replace(/[^a-z0-9]/g, "-");
  let ticketChannel = guild.channels.cache.find(
    (ch) => ch.parentId === categoryId && ch.type === ChannelType3.GuildText && Boolean(ch.topic?.includes(message.author.id))
  );
  if (!ticketChannel) {
    try {
      const channelName = `ticket-${cleanUsername}`;
      ticketChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType3.GuildText,
        parent: categoryId,
        topic: `ModMail ticket for ${message.author.tag} (${message.author.id})`,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits2.ViewChannel]
          },
          {
            id: message.client.user?.id ?? "",
            // Safe fallback, though unlikely to be null if logged in
            allow: [
              PermissionFlagsBits2.ViewChannel,
              PermissionFlagsBits2.SendMessages,
              PermissionFlagsBits2.ViewChannel
            ]
          }
        ]
      });
      const welcomeEmbed = new EmbedBuilder2().setColor("#00FF00").setTitle("\u{1F4E8} New ModMail Ticket").setDescription(
        `**User:** ${message.author.tag} (${message.author.id})
**Account Created:** <t:${Math.floor(
          message.author.createdTimestamp / 1e3
        )}:R>`
      ).setThumbnail(message.author.displayAvatarURL()).setTimestamp();
      await ticketChannel.send({ embeds: [welcomeEmbed] });
      await message.react("\u2705");
    } catch (error) {
      logger.error("Error creating ticket:", {
        error: error instanceof Error ? error.message : String(error)
      });
      await message.reply("\u274C Failed to create ticket. Please contact an administrator.");
      return;
    }
  }
  const embed = new EmbedBuilder2().setColor("#0099FF").setAuthor({
    name: message.author.tag,
    iconURL: message.author.displayAvatarURL()
  }).setDescription(message.content || "*[No text content]*").setFooter({ text: `User ID: ${message.author.id}` }).setTimestamp();
  const imageAttachment = message.attachments.find(
    (a) => a.contentType && a.contentType.startsWith("image/")
  );
  if (imageAttachment) {
    embed.setImage(imageAttachment.url);
  }
  const otherAttachments = message.attachments.filter((a) => !a.contentType || !a.contentType.startsWith("image/")).map((a) => a.url);
  try {
    await ticketChannel.send({
      content: message.content,
      // Content outside embed for mentions/previews
      embeds: [embed],
      files: otherAttachments
    });
  } catch (error) {
    logger.error("Error forwarding message:", { error });
  }
}
async function handleStaffReply(message) {
  if (message.content.startsWith("!")) return;
  if (message.channel.type !== ChannelType3.GuildText) return;
  const userId = message.channel.topic?.match(/\((\d+)\)/)?.[1];
  if (!userId) return;
  try {
    const user = await message.client.users.fetch(userId);
    const embed = new EmbedBuilder2().setColor("#00FF00").setAuthor({
      name: "Staff Reply",
      iconURL: message.author.displayAvatarURL()
    }).setDescription(message.content || "*[No text content]*").setTimestamp();
    const imageAttachment = message.attachments.find(
      (a) => a.contentType && a.contentType.startsWith("image/")
    );
    if (imageAttachment) {
      embed.setImage(imageAttachment.url);
    }
    const otherAttachments = message.attachments.filter((a) => !a.contentType || !a.contentType.startsWith("image/")).map((a) => a.url);
    await user.send({
      content: message.content,
      embeds: [embed],
      files: otherAttachments
    });
    await message.react("\u2705");
  } catch (error) {
    await message.react("\u274C");
    logger.error("Error sending reply to user", {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// src/discord/client.ts
function createDiscordClient() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildBans,
      GatewayIntentBits.GuildPresences,
      GatewayIntentBits.GuildInvites
    ],
    partials: [Partials.Channel, Partials.Message]
  });
  client.once(Events.ClientReady, (c) => {
    logger.info(`Ready! Logged in as ${c.user.tag}`);
  });
  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        await handleSlashCommand(interaction);
      } else if (interaction.isButton()) {
        await handleInteractionCreate(interaction);
      }
    } catch (error) {
      logger.error("Error handling interaction", {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  client.on(Events.MessageCreate, async (message) => {
    try {
      await handleMessageCreate(message);
    } catch (error) {
      logger.error("Error handling message", {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  return client;
}

// src/index.ts
async function main() {
  logger.info("Starting ModMail Bot...");
  await loadCommands();
  try {
    const client = createDiscordClient();
    await client.login(config.discordToken);
  } catch (error) {
    logger.error("Fatal error during startup", {
      error: error instanceof Error ? error.message : String(error)
    });
    process.exit(1);
  }
}
main();
