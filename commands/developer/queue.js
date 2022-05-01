const { MessageEmbed } = require("discord.js");
const { default: padWithLeadingZeroes } = require("leading-zeroes");
const MongoTicket = require("../../library/ticket");
const MongoGuild = require("../../library/guild");
const { splitArray } = require("../../utils/splitArray");
module.exports = {
  name: "queue",
  aliases: ["list", "queuelist", "listqueue"],
  minArgs: 1,
  expectedArgs: "<game>",
  description: "Lists pending reports and suggestions of the suggested game",
  run: async function (message, args) {
    if (
      message.guild.ownerID !== message.author.id &&
      !message.member.permissions.has("ADMINISTRATOR")
    ) {
      const role = message.guild.roles.cache.get(
        message.guild.database.headrole
      );
      if (!role)
        return message
          .reply(
            `there currently isn't a head-developer-role set, please contact the owner of the server.`
          )
          .catch(() => {
            return;
          });
      if (!message.member.roles.cache.has(role.id))
        return message.reply(`you are not a head developer.`).catch(() => {
          return;
        });
    }
    const game = args.join(" ");
    if (!message.guild.database.games.includes(game))
      return message.channel.send(`**${game}** does not exist`);

    const tickets = await new MongoTicket(message.guild.id).get({
      guild: true,
    });
    const suggestions = tickets.filter(
      (t) => t.type == "suggestion" && t.game == game && t.status == "publish"
    );
    const reports = tickets.filter(
      (t) => t.type == "report" && t.game == game && t.status == "publish"
    );

    const embed = new MessageEmbed().setTitle("Bugs and Features To-Publish");

    const splitSuggestions = splitArray(suggestions, 7);
    const splitReports = splitArray(reports, 7);
    const suggestionFields = splitSuggestions.map(
      (suggestions) =>
        suggestions
          .map(
            (t) =>
              `\`#${padWithLeadingZeroes(t.tag, 4)}\` **${trimString(
                t.title,
                35
              )}**\nSuggestor: <@${t.authorId}>`
          )
          .join("\n\n") || "None"
    );
    const reportFields = splitReports.map(
      (reports) =>
        reports
          .map(
            (t) =>
              `\`#${padWithLeadingZeroes(t.tag, 4)}\` **${trimString(
                t.title,
                35
              )}**\nReporter: <@${t.authorId}>`
          )
          .join("\n\n") || "None"
    );

    const reportQueue = reportFields.map((reports) =>
      new MessageEmbed(embed).addField("Reports", reports)
    );
    const suggestionQueue = suggestionFields.map((sugestions) =>
      new MessageEmbed(embed).addField("Suggestions", sugestions)
    );

    // embed
    //   .addField(
    //     "Suggestions",
    //     suggestions
    //       .map(
    //         (t) =>
    //           `\`#${padWithLeadingZeroes(t.tag, 4)}\` **${trimString(
    //             t.title,
    //             35
    //           )}**\nSuggestor: <@${t.authorId}>`
    //       )
    //       .join("\n\n") || "None"
    //   )
    //   .addField(
    //     "Reports",
    //     reports
    //       .map(
    //         (t) =>
    //           `\`#${padWithLeadingZeroes(t.tag, 4)}\` **${trimString(
    //             t.title,
    //             35
    //           )}**\nReporter: <@${t.authorId}>`
    //       )
    //       .join("\n\n") || "None"
    //   );
    // Checks if something in the Queue that could be published, return
    if (reportQueue.length < 1 && suggestionQueue.length < 1)
          return message.reply("there is nothing in the Queue that I could publish!");
    return (
      reportQueue.map((e) => message.channel.send(e)) &&
      suggestionQueue.map((e) => message.channel.send(e))
    );
    
    message.channel.send(embed);
  },
};

function trimString(str, max) {
  return str.length > max ? `${str.slice(0, max - 3)}...` : str;
}
