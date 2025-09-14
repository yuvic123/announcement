const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const app = express();
const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const PORT = process.env.PORT || 3000;
let latestAnnouncement = { message: "", author: "", timestamp: "" };
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
});
app.get("/announcement", (req, res) => {
  res.json(latestAnnouncement);
});
app.listen(PORT, () => console.log(`🌐 API on :${PORT}`));
registerCommands().then(() => client.login(TOKEN));
