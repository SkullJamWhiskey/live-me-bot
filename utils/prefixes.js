const { Client } = require("discord.js");
const { prefix: defaultPrefix } = require("../config");
const mongo = require("../mongo");
const guildSchema = require("../mongodb/guild");
module.exports.guildPrefixes = guildPrefixes = {};
/**
 *
 * @param {Client} client
 */
module.exports.loadPrefixes = async (client) => {
  mongo().then(async (mongoose) => {
    // const guilds = Array.from(client.guilds.cache.values());
    const guildModels = await guildSchema.find({});

    try {
      guildModels.map((g) => {
        this.guildPrefixes[g.id] = {};
        this.guildPrefixes[g.id].prefix = g.prefix;
      });
    } finally {
      mongoose.connection.close();
      console.log(this.guildPrefixes);
      console.log("Prefixes gathered");
    }
  });
};

module.exports.getPrefix = (guildId) =>
  this.guildPrefixes[guildId]?.prefix || defaultPrefix;
  module.exports.setPrefix = (guildId, prefix) => {
    if (this.guildPrefixes[guildId]) {
      this.guildPrefixes[guildId].prefix = prefix;
    } else {
      this.guildPrefixes[guildId] = {};
      this.guildPrefixes[guildId].prefix = prefix;
    }
  };
  