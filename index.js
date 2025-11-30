const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");

const app = express();
app.use(express.json()); // IMPORTANT for POST body parsing

// ENV VARIABLES
const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const PORT = process.env.PORT || 3000;

// STORED DATA
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
    description: "Teleport all Roblox clients to a JobId",
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
    name: "clear",
    description: "Clear stored announcement + jobId"
  }
];

// REGISTER SLASH COMMANDS
async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
    body: commands,
  });
  console.log("Slash commands registered.");
}

// DISCORD CLIENT INIT
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("clientReady", () => {
  console.log("Bot online:", client.user.tag);
});

// SLASH COMMAND HANDLER
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const userId = interaction.user.id;

  // PERMISSION CHECK
  if (!allowedUsers.includes(userId)) {
    return interaction.reply({
      content: "❌ You are not allowed to use this command.",
      ephemeral: true
    });
  }

  // ALWAYS REPLY IMMEDIATELY — FIXES Unknown Interaction
  await interaction.deferReply({ ephemeral: true });

  // ANNOUNCEMENT COMMAND
  if (interaction.commandName === "announcement") {
    const msg = interaction.options.getString("message");

    latestAnnouncement = {
      message: msg,
      author: interaction.user.tag,
      timestamp: Date.now().toString()
    };

    await interaction.editReply(`📢 Announcement sent:\n\n**${msg}**`);
    return;
  }

  // JOIN COMMAND
  if (interaction.commandName === "join") {
    const jobId = interaction.options.getString("jobid");

    lastJoinRequest = {
      jobId,
      author: interaction.user.tag,
      timestamp: Date.now().toString()
    };

    await interaction.editReply(
      `🔄 Teleport request sent.\nJobId: **${jobId}**`
    );
    return;
  }

  // CLEAR COMMAND
  if (interaction.commandName === "clear") {
    latestAnnouncement = { message: "", author: "", timestamp: "" };
    lastJoinRequest = { jobId: "", author: "", timestamp: "" };

    await interaction.editReply("🧹 Cleared announcement + join data.");
    return;
  }
});

// API ENDPOINTS
app.get("/announcement", (req, res) => {
  res.json(latestAnnouncement);
});

app.get("/join", (req, res) => {
  res.json(lastJoinRequest);
});

// CLEAR JOBID FROM ROBLOX AFTER TELEPORT
app.post("/join", (req, res) => {
  lastJoinRequest.jobId = "";
  res.json({ status: "cleared" });
});

// CLEAR ANNOUNCEMENT FROM ROBLOX AFTER SHOWING
app.post("/announcement", (req, res) => {
  latestAnnouncement.message = "";
  res.json({ status: "cleared" });
});

app.listen(PORT, () =>
  console.log(`🌐 API running on port ${PORT}`)
);

registerCommands().then(() => client.login(TOKEN));
