const { MessageEmbed } = require("discord.js");
const MongoGuild = require("../library/guild");
const MongoTicket = require("../library/ticket");
const { default: padWithLeadingZeroese } = require("leading-zeroes");
module.exports = async function (client, reaction, user) {
  const { message, emoji: e } = reaction;
  const { guild } = message;
  const emoji = e.name;
  if (!["📥", "📙", "🟢", "🟠", "🔴", "🏁", "⚫"].includes(emoji)) return;

  const data = await new MongoTicket(guild.id, message.id).get(message.id);
  if (!data || data.status !== "todo") return;

  if (!guild.database) guild.database = await new MongoGuild(guild.id).get();
  const channel = guild.channels.cache.get(guild.database.todoch);
  if (!channel) return;

  // Delete
  if (emoji == "⚫") {
    message.delete().catch((err) => {
      console.log("todo, black", err);
    });
    return new MongoTicket(guild.id, message.id).delete();
  }
  // Reserve
  if (emoji == "📥") {
    reaction.users.remove(user);

    let number = 2;
    if (data.type == "report") number = 4;
    let field = message.embeds[0].fields[number];
    let { value } = field;
    const reserves = data.moderators;

    ids = [user.id];
    value = [`${user}`];

    if (reserves.includes(user.id)) {
      const index = reserves.findIndex((e) => e === user.id);
      reserves.splice(index, 1);
      ids = [];
      value = [];
    }

    for (const id of reserves) {
      const member = await guild.members.fetch(id || "none").catch(() => {
        return;
      });
      if (member) {
        ids.push(member.id);
        value.push(`${member}`);
      }
    }
    new MongoTicket(guild.id, message.id).set({
      property: "moderators",
      toSet: ids,
    });
    if (ids.length) {
      return message.edit(
        message.embeds[0].spliceFields(number, 1, {
          name: "Reserved by",
          value: value.join(", "),
          inline: true, 
        })
      );
    } else {
      return message.edit(
        message.embeds[0].spliceFields(number, 1, {
          name: "Reserved by",
          value: "Nobody",
          inline: true,
        })
      );
    }
  }
  // Publish Queue
  if (emoji == "📙") {
    message.delete().catch((err) => {
      console.log("TODO book orange err", err);
    });
    return new MongoTicket(guild.id, message.id).set({
      property: "status",
      toSet: "publish",
    });
  }
  // Publish Now
  if (emoji == "🏁") {
    if (!message.guild.database)
      message.guild.database = await new MongoGuild(message.guild.id).get();
    const role = message.guild.roles.cache.get(message.guild.database.headrole);
    if (!role)
      return user
        .send(
          `there currently isn't a head-developer-role set, please contact the owner of the server.`
        )
        .catch(() => {
          return;
        });

    const member = await message.guild.members.fetch(user.id).catch(() => {
      return;
    });
    if (!member.roles.cache.has(role.id))
      return user.send(`you are not a head developer.`).catch(() => {
        return;
      });

    const msg = await message.channel.send(
      `Where would you like to publish \`#${padWithLeadingZeroese(
        data.tag,
        4
      )}\` in?`
    );
    const filter = (m) => m.author.id == user.id;
    const collection = await message.channel.awaitMessages(filter, {
      max: 1,
      time: 60000,
    });
    if (!collection.size) {
      reaction.users.remove(user);
      return msg.delete().catch((err) => {
        console.log("publish now finish flag err", err);
      });
    }
    let collected = collection.first().content;
    if (collected.startsWith("<#") && collected.endsWith(">"))
      collected = collected.replace(/\D/g, "");
    const channel = message.guild.channels.cache.find(
      (c) => c.isText && [c.id, c.name].includes(collected.toLowerCase())
    );
    if (!channel) {
      reaction.users.remove(user);
      msg.edit(`**${collected}** is an invalid text-based channel`);
      return setTimeout(
        () =>
          msg.delete().catch((err) => {
            console.log("todo finish flag publish no channel err", err);
          }),
        3000
      );
    }

    message.delete().catch((err) => {
      console.log("todo finish flag channel err", err);
    });
    new MongoTicket(guild.id, message.id).delete();
    const embed = new MessageEmbed();
    if (data.type == "suggestion") {
      embed
        .setTitle("Feature Addition List")
        .setDescription(
          "A list of feature requests that we were able to add with this update."
        )
        .addField(
          `\`#${padWithLeadingZeroese(data.tag, 4)}\` ${data.title}`,
          `Suggested by <@${data.authorId}> and implemented by ${
            data.moderators.map((m) => `<@${m}>`).join(", ") || "anonymous"
          }`
        );
    } else {
      embed
        .setTitle("Bug Fix List")
        .setDescription(
          "A list of bug reports that we were a ble to fix with this update."
        )
        .addField(
          `\`#${padWithLeadingZeroese(data.tag, 4)}\` ${data.title}`,
          `Reported by <@${data.authorId}> and fixed by ${
            data.moderators.map((m) => `<@${m}>`).join(", ") || "anonymous"
          }`
        );
    }
    channel.send(embed);
  }
  // Report Only
  if (data.type == "report") {
    if (!["🟢", "🟠", "🔴"].includes(emoji)) return;
    reaction.users.remove(user);

    let severity = "Low";
    let color = "GREEN";
    if (emoji == "🟠") {
      severity = "Medium";
      color = "ORANGE";
    }
    if (emoji == "🔴") {
      severity = "High";
      color = "RED";
    }

    const field = message.embeds[0].fields[3];
    if (field.value == severity) return;
    return message.edit(
      message.embeds[0]
        .spliceFields(3, 1, { name: "Severity", value: severity, inline: true })
        .setColor(color)
    );
  }
};
