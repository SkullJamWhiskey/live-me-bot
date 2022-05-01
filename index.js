require("module-alias/register");
const mongo = require("./mongo");
const { loadPrefixes } = require("./utils/prefixes");
const Discord = require("discord.js");
const client = new Discord.Client({ partials: ["MESSAGE", "REACTION"] });
client.config = require("./config");
client.commands = new Discord.Collection();

const { registerEvents, registerCommands } = require("./utils/registry");
const config = require("./config");
client.once("ready", async function () {
  console.log("Connected to Discord");
  await mongo().then(async () => console.log("Connected to Mongo"));
  await registerEvents(client, "../events");
  await registerCommands(client, "../commands");
  await loadPrefixes(client);
});

// Status of Bot
client.on("ready", () => {
  client.user.setActivity(
    `${config.prefix}help | ${client.guilds.cache.size} servers | ${client.users.cache.size} users`,
    { type: "WATCHING" }
  );
  setInterval(() => {
    client.user.setActivity(
      `${config.prefix}help | ${client.guilds.cache.size} servers | ${client.users.cache.size} users`,
      { type: "WATCHING" }
    );
  }, 360000); // Runs this every 3600 seconds (1 Hour).
});

client.login(client.config.token);