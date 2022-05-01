const guildSchema = require("../../mongodb/guild");
const mongo = require("../../mongo");
const { Message } = require("discord.js");
const { setPrefix } = require("../../utils/prefixes");

module.exports = {
  name: "set-prefix",
  aliases: ["setprefix", "prefix"],
  description: "Sets the prefix for the bot for this server.",
  expectedArgs: "<prefix>",
  /**
   *
   * @param {Message} message
   * @param {Array<any>} args
   * @returns
   */
  run: async function (message, args) {
    if (!args.length) return message.reply(this.expectedArgs);
    if (!message.member.hasPermission("ADMINISTRATOR"))
      return message.reply("Not an admin");

    await mongo().then(async (conn) => {
      try {
        const prefix = args[0];
        await guildSchema
          .findOneAndUpdate(
            { id: message.guild.id },
            { id: message.guild.id, prefix },
            { upsert: true }
          )
          .then(() => {
            setPrefix(message.guild.id, prefix);
          });

        message.reply("set prefix to " + prefix);
      } finally {
        conn.connection.close();
      }
    });
  },
};
