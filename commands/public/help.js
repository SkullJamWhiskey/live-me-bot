const { MessageEmbed } = require("discord.js");
const config = require("../../config");
const { setPrefix, getPrefix } = require("../../utils/prefixes");
module.exports = {
  name: "help",
  aliases: ["commands", "cmds"],
  description: "Adds a game to the database",

  run: async function (message, args, client) {
    const { author, guild } = message;
    const prefix = getPrefix(guild?.id) || config.prefix;
    return message.channel.send({
      embed: {
        color: 39423,
        description:
          `Hi, here are all of my current commands:\n\n` +
          `**User Commands**\n` +
          `\`${prefix}help\` - Shows this list of commands\n` +
          `\`${prefix}invite\` - Invite me to a other Server\n` +
          `\`${prefix}report\` - Report a bug\n` +
          `\`${prefix}suggest\` - Suggest a Idea\n` +
          `\n**Developer Commands**\n` +
          `\`${prefix}list-game\` - Shows the list of games that have been added to this Server\n` +
          `\`${prefix}add-game\` - Add a new Game to this Server\n` +
          `\`${prefix}delete-game\` - Remove an excisiting Game from this Server\n` +
          `\`${prefix}publish\` - Publish a new Version of a Game with all of the suggestions or bug reports\n` +
          `\`${prefix}queue\` - Lists pending reports and suggestions of the suggested game\n` +
          `\n**Owner Commands**\n` +
          `\`${prefix}holding-channel\` - Sets the head-development channel\n` +
          `\`${prefix}set-head-dev\` - Sets the role for head developers\n` +
          `\`${prefix}todo-channel\` - Sets the todo channel\n` +
          `\`${prefix}set-prefix\` - Set's server-wide prefix`,
        author: {
          name: message.author.tag,
          icon_url: message.author.displayAvatarURL(),
        },
        footer: {
                text: "You have any Problems using this Bot?\n https://discord.gg/ySk5eYrrjG"
            }
      },
    });
  },
};
