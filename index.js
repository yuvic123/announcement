const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");

const app = express();
const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const PORT = process.env.PORT || 3000;

// Announcement system
let latestAnnouncement = { message: "", author: "", timestamp: "" };

// Join system: track commands in a list
let joinRequests = []; // array of { jobId, author, timestamp }

const allowedUsers = [
  "598460565387476992",
  "1272478153201422420",
  "1356133222752190605",
  "1279868613628657860"
];

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

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
    body: commands,
  });
  console.log("Commands registered");
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
  console.log("Bot ready:", client.user.tag);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const userId = interaction.user.id;
  if (!allowedUsers.includes(userId)) {
    return interaction.reply({
      content: "You are not allowed to use this command.",
      ephemeral: true
    });
  }

  if (interaction.commandName === "announcement") {
    const msg = interaction.options.getString("message");
    latestAnnouncement = {
      message: msg,
      author: interaction.user.tag,
      timestamp: new Date().toISOString(),
    };
    await interaction.reply({ content: `Sent: ${msg}`, ephemeral: true });
    console.log("New announcement:", msg);
  }

  if (interaction.commandName === "join") {
    const jobId = interaction.options.getString("jobid");

    // Save as a new join request
    joinRequests.push({
      jobId,
      author: interaction.user.tag,
      timestamp: new Date().toISOString(),
    });

    await interaction.reply({
      content: `Teleport command sent. JobId: **${jobId}**`,
      ephemeral: true,
    });
    console.log("New teleport request:", jobId);
  }
});

// Endpoint for announcements
app.get("/announcement", (req, res) => {
  res.json(latestAnnouncement);
});

// Endpoint for join commands
// Send the **latest unprocessed command** to each Roblox client
app.get("/join", (req, res) => {
  if (joinRequests.length === 0) {
    return res.json({ jobId: "", timestamp: "" });
  }

  // Return the **oldest unprocessed join command**
  const nextJoin = joinRequests.shift(); // remove from array so clients don't process it again
  res.json(nextJoin);
});

app.listen(PORT, () => console.log(`🌐 API running on :${PORT}`));

registerCommands().then(() => client.login(TOKEN));
