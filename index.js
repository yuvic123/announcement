const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");

const app = express();

const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const PORT = process.env.PORT || 3000;

let lastJoinRequest = { jobId: "", author: "", timestamp: "" };
let lastAnnouncement = { message: "", author: "", timestamp: "" };
let lastMessage = { message: "", jobId: "", author: "", timestamp: "" };


const allowedUsers = [
  "598460565387476992",
  "1272478153201422420",
  "1356133222752190605",
  "1394841779467190384",
  "1279868613628657860", 
  "775027702888661022", 
  "1136348884260622407" 
];
const commands = [
  {
    name: "join",
    description: "Teleport all Roblox players to a JobId",
    options: [
      {
        name: "jobid",
        type: 3,
        description: "JobId to teleport to",
        required: true,
      },
    ],
  },
  {
    name: "announcement",
    description: "Send a notification message to all Roblox players",
    options: [
      {
        name: "message",
        type: 3,
        description: "Message to notify",
        required: true,
      },
    ],
  },
  {
    name: "message",
    description: "Send a popup message with Join/Decline buttons",
    options: [
      {
        name: "message",
        type: 3,
        description: "Popup message text",
        required: true,
      },
      {
        name: "jobid",
        type: 3,
        description: "JobId to join if clicked",
        required: true,
      },
    ],
  },
];

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
    body: commands,
  });
  console.log("Slash commands registered");
}
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log("Bot is ready as:", client.user.tag);
});
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const userId = interaction.user.id;
  if (!allowedUsers.includes(userId)) {
    return interaction.reply({
      content: "❌ You are not allowed to use this bot.",
      ephemeral: true,
    });
  }
  if (interaction.commandName === "join") {
    const jobId = interaction.options.getString("jobid");
    lastJoinRequest = {
      jobId,
      author: interaction.user.tag,
      timestamp: new Date().toISOString(),
    };
    await interaction.reply({
      content: `✅ Teleport command sent.\nJobId: **${jobId}**`,
      ephemeral: true,
    });
    console.log("Teleport request:", jobId);
  }
  if (interaction.commandName === "announcement") {
    const message = interaction.options.getString("message");
    lastAnnouncement = {
      message,
      author: interaction.user.tag,
      timestamp: new Date().toISOString(),
    };
    await interaction.reply({
      content: `📢 Announcement sent: **${message}**`,
      ephemeral: true,
    });
    console.log("Announcement:", message);
  }
  if (interaction.commandName === "message") {
    const message = interaction.options.getString("message");
    const jobId = interaction.options.getString("jobid");
    lastMessage = {
      message,
      jobId,
      author: interaction.user.tag,
      timestamp: new Date().toISOString(),
    };
    await interaction.reply({
      content: `📨 Popup message sent: **${message}**\nJobId: **${jobId}**`,
      ephemeral: true,
    });
    console.log("Popup message:", message, jobId);
  }
});
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  const content = message.content.trim();
  const userId = message.author.id;
  if (!allowedUsers.includes(userId)) return;
  if (content.startsWith(".join ")) {
    const jobId = content.split(" ").slice(1).join(" ");
    if (!jobId) return message.reply("❌ Usage: `.join <jobid>`");
    lastJoinRequest = {
      jobId,
      author: message.author.tag,
      timestamp: new Date().toISOString(),
    };
    message.reply(`✅ Teleport command sent.\nJobId: **${jobId}**`);
    console.log("Teleport request:", jobId);
  }
  if (content.startsWith(".announcement ")) {
    const announcement = content.split(" ").slice(1).join(" ");
    if (!announcement) return message.reply("❌ Usage: `.announcement <message>`");
    lastAnnouncement = {
      message: announcement,
      author: message.author.tag,
      timestamp: new Date().toISOString(),
    };
    message.reply(`📢 Announcement sent: **${announcement}**`);
    console.log("Announcement:", announcement);
  }
  if (content.startsWith(".message ")) {
    const args = content.split(" ");
    args.shift();
    if (args.length < 2)
      return message.reply("❌ Usage: `.message <text> <jobid>`");
    const jobId = args.pop();
    const msgText = args.join(" ");
    lastMessage = {
      message: msgText,
      jobId,
      author: message.author.tag,
      timestamp: new Date().toISOString(),
    };
    message.reply(`📨 Popup message sent.\n**${msgText}**\nJobId: **${jobId}**`);
    console.log("Popup message:", msgText, jobId);
  }
});
app.get("/join", (req, res) => {
  res.json(lastJoinRequest);
});
app.get("/announcement", (req, res) => {
  res.json(lastAnnouncement);
});
app.get("/message", (req, res) => {
  res.json(lastMessage);
});
app.listen(PORT, () => console.log(`🌐 API running on port ${PORT}`));
registerCommands().then(() => client.login(TOKEN));
