const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");

const app = express();

// ENV VARIABLES
const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const PORT = process.env.PORT || 3000;

// STORED DATA (WILL RESET AUTOMATICALLY AFTER ROBLOX FETCHES)
let latestAnnouncement = { message: "", author: "", timestamp: "" };
let lastJoinRequest = { jobId: "", author: "", timestamp: "" };

// ALLOWED DISCORD USER IDS
const allowedUsers = [
  "598460565387476992",
  "1272478153201422420",
  "1356133222752190605",
  "1279868613628657860"
];

// SLASH COMMANDS
const commands = [
  {
    name: "announcement",
    description: "Send announcement to Roblox",
    options: [
      {
        name: "message",
        type: 3,
        description: "Announcement text",
        required: true,
      },
    ],
  },
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
];

// REGISTER COMMANDS
async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
    body: commands,
  });
  console.log("Commands registered");
}

// DISCORD BOT
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
  console.log("Bot ready:", client.user.tag);
});

// SLASH COMMAND HANDLER
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const userId = interaction.user.id;

  // PERMISSION CHECK
  if (!allowedUsers.includes(userId)) {
    return interaction.reply({
      content: "You are not allowed to use this command.",
      ephemeral: true
    });
  }

  // /announcement
  if (interaction.commandName === "announcement") {
    const msg = interaction.options.getString("message");

    latestAnnouncement = {
      message: msg,
      author: interaction.user.tag,
      timestamp: new Date().toISOString(),
    };

    await interaction.reply({ content: `Announcement sent: ${msg}`, ephemeral: true });
    console.log("New announcement:", msg);
  }

  // /join
  if (interaction.commandName === "join") {
    const jobId = interaction.options.getString("jobid");

    lastJoinRequest = {
      jobId,
      author: interaction.user.tag,
      timestamp: new Date().toISOString(),
    };

    await interaction.reply({
      content: `Teleport command sent. JobId: **${jobId}**`,
      ephemeral: true,
    });

    console.log("New teleport request:", jobId);
  }
});


// =====================================================
// ONE-TIME ENDPOINTS (RESET AFTER ROBLOX FETCHES THEM)
// =====================================================

// Announcement fetch (and reset)
app.get("/announcement", (req, res) => {
  const temp = { ...latestAnnouncement };
  latestAnnouncement = { message: "", author: "", timestamp: "" };
  res.json(temp);
});

// Join fetch (and reset)
app.get("/join", (req, res) => {
  const temp = { ...lastJoinRequest };
  lastJoinRequest = { jobId: "", author: "", timestamp: "" };
  res.json(temp);
});

// START SERVER
app.listen(PORT, () => console.log(`🌐 API running on :${PORT}`));

registerCommands().then(() => client.login(TOKEN));
