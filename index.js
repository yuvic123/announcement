const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");

const app = express();
app.use(express.json());

// ENV
const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const PORT = process.env.PORT || 3000;

// STORED DATA (FIXED)
let latestAnnouncement = {
  message: "",
  author: "",
  timestamp: ""
};

let lastJoinRequest = {
  jobId: "",
  author: "",
  timestamp: ""
};

// Permission list
const allowedUsers = [
  "598460565387476992",
  "1272478153201422420",
  "1356133222752190605",
  "1279868613628657860"
];

// Slash commands
const commands = [
  {
    name: "announcement",
    description: "Send announcement to Roblox players",
    options: [
      {
        name: "message",
        type: 3,
        description: "Announcement text",
        required: true
      }
    ]
  },
  {
    name: "join",
    description: "Teleport players to a specific JobId",
    options: [
      {
        name: "jobid",
        type: 3,
        description: "The target JobId",
        required: true
      }
    ]
  }
];

// Register commands
async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );

  console.log("Slash commands registered.");
}

// Discord bot init
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
  console.log("Bot online:", client.user.tag);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const userId = interaction.user.id;

  // Permission check
  if (!allowedUsers.includes(userId)) {
    return interaction.reply({
      content: "❌ You are not allowed to use this command.",
      ephemeral: true
    });
  }

  // /announcement
  if (interaction.commandName === "announcement") {
    const msg = interaction.options.getString("message");

    latestAnnouncement = {
      message: msg,
      author: interaction.user.tag,
      timestamp: Date.now().toString()
    };

    await interaction.reply({
      content: `📢 Announcement sent:\n\n**${msg}**`,
      ephemeral: true
    });

    console.log("Announcement:", msg);
  }

  // /join
  if (interaction.commandName === "join") {
    const jobId = interaction.options.getString("jobid");

    lastJoinRequest = {
      jobId,
      author: interaction.user.tag,
      timestamp: Date.now().toString()
    };

    await interaction.reply({
      content: `🔄 Teleport request sent.\nJobId: **${jobId}**`,
      ephemeral: true
    });

    console.log("Join request:", jobId);
  }
});

// API ENDPOINTS
app.get("/announcement", (req, res) => {
  res.json(latestAnnouncement);
});

app.post("/announcement", (req, res) => {
  // Roblox sends { clear: true }
  latestAnnouncement = { message: "", author: "", timestamp: "" };
  res.json({ status: "cleared" });
});

app.get("/join", (req, res) => {
  res.json(lastJoinRequest);
});

app.post("/join", (req, res) => {
  // Roblox sends { clear: true }
  lastJoinRequest = { jobId: "", author: "", timestamp: "" };
  res.json({ status: "cleared" });
});

// Start server
app.listen(PORT, () => console.log(`🌐 API running on port ${PORT}`));

// Start Discord bot
registerCommands().then(() => client.login(TOKEN));
