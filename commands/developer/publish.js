const { MessageEmbed } = require("discord.js");
const MongoTicket = require("../../library/ticket");
const { default: padWithLeadingZeroese } = require("leading-zeroes");
const { splitArray } = require("../../utils/splitArray");
module.exports = {
  name: "publish",
  minArgs: 1,
  expectedArgs: "<#channel/id> <game>",
  description: "Allows you to publish a game.",
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

    const string = `${message.client.config.prefix}${this.name} ${args[0]} `;

    if (args[0].startsWith("<#") && args[0].endsWith(">"))
      args[0] = args[0].replace(/\D/g, "");
    const channel = message.guild.channels.cache.find(
      (c) => c.isText && [c.id, c.name].includes(args[0].toLowerCase())
    );
    if (!channel)
      return message.reply(`**${args[0]}** is an invalid text-based channel`);
    // const webhook =
    //   (await channel.fetchWebhooks()).first() ||
    //   (await channel.createWebhook(message.client.user.username, {
    //     avatar: message.client.user.displayAvatarURL(),
    //   }));
    // if (!webhook)
    //   return message.reply(
    //     `I do not have the permissions to create/send a webhook in ${channel}`
    //   );

    const game = message.content.slice(string.length, message.content.length);
    if (!message.guild.database.games.includes(game))
      return message.reply(`**${game}** is not an existing game.`);

    const data = await new MongoTicket(message.guild.id).get({ guild: true });
    const filter = (m) => m.author.id == message.author.id;

    const msg = await message.channel.send(
      `Please state what has been added to this game, you can type \`done\` when you're finished, or if nothing has been added.\nYou can type \`cancel\` to cancel the current Update Shout.`,
      {
        embed: {
          fields: [
            { name: "Add-ons", value: "None" },
            { name: "Changes", value: "None" },
          ],
        },
      }
    );
    let counter = 0;
    const addons = [];
    const changes = [];
    const collector = message.channel.createMessageCollector(filter, {
      time: 3.6e6,
    });
    collector
      .on("collect", function (m) {
        const { content } = m;
        if (content.toLowerCase() == "cancel") {return collector.stop({ reason: 'cancel' })}
        if (content.toLowerCase() == "done") {
          counter++;
          if (counter == 1)
            return msg.edit(
              "Now state what has been changed in this game, you can type \`done\` when you're finished, or if nothing has been changed.\nYou can type \`cancel\` to cancel the current Update Shout.",
              {
                embed: {
                  fields: [
                    { name: "Add-ons", value: addons.map((a) => `-${a}`).join("\n")},
                    { name: "Changes", value: "None" },
                  ],
                },
              }
            );
          if (counter == 2) return collector.stop({ reason: "fin" });
        } else {
          const embed = msg.embeds[0];
          if (counter == 0) {
            addons.push(content);
            return msg.edit(
              embed.spliceFields(counter, 1, {
                name: "Add-ons",
                value: addons.map((a) => `-${a}`).join("\n"),
              })
            );
          }
          if (counter == 1) {
            changes.push(content);
            return msg.edit(
              embed.spliceFields(counter, 1, {
                name: "Changes",
                value: changes.map((c) => `-${c}`).join("\n"),
              })
            );
          }
        }
      })
      .on("end", function (d, { reason }) {
        if (!reason)
          return msg
            .edit("You took too long")
            .then((m) => setTimeout(() => m.delete(), 3000));
        else if(reason == "fin"){
        const embeds = [];
        if (addons.length || changes.length) {
          const embed = new MessageEmbed()
            .setTitle(`${game} Update`)
            .setDescription(
              `We are happy to announce that ${game} has been updated.\nSee below for the changes.`
            );
          if (addons.length)
            embed.addField(
              "What has been added",
              addons.map((a) => `-${a}`).join("\n")
            );
          if (changes.length)
            embed.addField(
              "Other Changes or Patches",
              changes.map((c) => `-${c}`).join("\n")
            );
          embeds.push(embed);
        }

        const toPublish = data.filter(
          (d) => d.status == "publish" && d.game == game
        );
        const suggestions = toPublish.filter((d) => d.type == "suggestion");
        const reports = toPublish.filter((d) => d.type == "report");

        if (suggestions.length || reports.length) {
          if (suggestions.length) {
            const splitSuggestions = splitArray(suggestions, 7);
            const embed = new MessageEmbed()
              .setTitle("Feature Addition List")
              .setDescription(
                "A list of feature requests that we were able to add with this update."
              );
            const fieldsArr = splitSuggestions.map((partialSuggestions) =>
              partialSuggestions.map((s) => {
                return {
                  name: `\`#${padWithLeadingZeroese(s.tag, 4)}\` ${trimString(
                    s.title,
                    30
                  )}`,
                  value: `Suggested by <@${s.authorId}> and implemented by ${
                    s.moderators.map((m) => `<@${m}>`).join(", ") || "anonymous"
                  }`,
                };
              })
            );
            const newEmbeds = fieldsArr.map((fields) =>
              new MessageEmbed(embed).addFields(fields)
            );
            embeds.push(...newEmbeds);
          }
          if (reports.length) {
            const splitReports = splitArray(reports, 7);
            const embed = new MessageEmbed()
              .setTitle("Bug Fix List")
              .setDescription(
                "A list of bug reports that we were able to fix with this update."
              );

            const fieldsArr = splitReports.map((partialReport) =>
              partialReport.map((r) => {
                return {
                  name: `\`#${padWithLeadingZeroese(r.tag, 4)}\` ${trimString(
                    r.title,
                    30
                  )}`,
                  value: `Reported by <@${r.authorId}> and fixed by ${
                    r.moderators.map((m) => `<@${m}>`).join(", ") ||
                    "anonoymous"
                  }`,
                };
              })
            );
            // const fields = reports.map(function (r) {
            //   return {
            //     name: `\`#${padWithLeadingZeroese(r.tag, 4)}\` ${r.title}`,
            //     value: `Reported by <@${r.authorId}> and fixed by ${
            //       r.moderators.map((m) => `<@${m}>`).join(", ") || "anonoymous"
            //     }`,
            //   };
            // });
            const newEmbeds = fieldsArr.map((fields) =>
              new MessageEmbed(embed).addFields(fields)
            );
            embeds.push(...newEmbeds);
          }
          new MongoTicket(message.guild.id).deletePublish(game);
        }
        if (!embeds.length)
          return message.reply("you can't just publish nothing!");
        // webhook.send({
        //   username: message.client.user.username,
        //   avatarURL: message.client.user.displayAvatarURL({ dynamic: true }),
        //   embeds,
        // });
        embeds.forEach((e) => {
          channel.send(e).catch((err) => console.log("CAUGHT", err));
        });
        channel.send("@everyone").then((m) => m.delete());
      }
      else if (reason = "cancel"){
        return msg.edit("Update Shout has been canceled!")
      }
      });
      
  },
};

function trimString(str, max) {
  return str.length > max ? `${str.slice(0, max - 3)}...` : str;
}
