const { Message, MessageReaction, User, Client } = require("discord.js");
const { MessageEmbed } = require("discord.js");
const { default: padWithLeadingZeroese } = require("leading-zeroes");
const MongoGuild = require("../library/guild");
const MongoTicket = require("../library/ticket");

/**
 *
 * @param {Client} client
 * @param {MessageReaction} reaction
 * @param {User} user
 * @returns
 */
module.exports = async function (client, reaction, user) {
  const { message, emoji: e } = reaction;
  const { guild } = message;
  const emoji = e.name;
  if (!["🟢", "🟠", "🔴", "⚫"].includes(emoji)) return;

  const data = await new MongoTicket(guild.id, message.id).get(message.id);
  if (!data || data.status !== "pending") return;

  if (!guild.database) guild.database = await new MongoGuild(guild.id).get();
  const channel = guild.channels.cache.get(guild.database.headch);
  if (!channel) return;

  if (data.type == "suggestion") {
    // Accept
    if (emoji == "🟢") {
      const todo = guild.channels.cache.get(guild.database.todoch);
      if (!todo)
        return user
          .send("The to-do channel has not been set yet.")
          .catch(() => {
            return;
          });
      const noPermissionsEmbed = new MessageEmbed()
        .setColor("RED")
        .setTitle("Missing permissions")
        .setTimestamp()
        .setThumbnail(message.guild.iconURL({ dynamic: true }))
        .setDescription(
          `*I am unable to post to ${todo}. I need permissions to \`SEND_MESSAGES\` in there to work properly.*`
        )
        .addField("Please contact an admin", "> Sorry for the inconvenience.");
      if (!message.guild.me.permissionsIn(todo).has("SEND_MESSAGES"))
        return message.reply(noPermissionsEmbed);

      new MongoTicket(guild.id, message.id).set({
        property: "status",
        toSet: "todo",
      });
      message.delete().catch((err) => {
        console.log("AHA SUGGESTION GREEN!!!");
        console.log(err);
      });

      message.embeds[0].fields[1].inline = true;
      const fields = [
        message.embeds[0].fields[0],
        message.embeds[0].fields[1],
        { name: "Reserved by", value: "Nobody", inline: true },
        message.embeds[0].fields[2],
        message.embeds[0].fields[3],
      ];
      message.embeds[0].spliceFields(
        0,
        message.embeds[0].fields.length,
        fields
      );
      const msg = await todo.send(message.embeds[0]);
      const emojis = ["📥", "📙", "🏁", "⚫"];
      await Promise.all(emojis.map((e) => msg.react(e))).catch((err) =>
        console.log("Someone reacted too quickly.")
      );

      new MongoTicket(guild.id, message.id).set({
        property: "messageId",
        toSet: msg.id,
      });

      const user2 = await client.users.fetch(data.authorId).catch(() => {
        return;
      });
      if (user2) {
        //user.send(`Your suggestion *${data.title}* has been accepted!`).catch(() => { return })
        const suggestionacceptedmbled = new MessageEmbed()
          .setColor("#5eab54")
          .setTitle(`Your suggestion *${data.title}* has been accepted`)
          .setDescription(
            `Your suggestion ${data.title} for ${data.game} has been accepted! We are doing our best to implement your suggestion as you imagine. In the meantime feel free to send another suggestion if you have any in mind!`
          );
        user2.send(suggestionacceptedmbled).catch(() => {
          return;
        });
      }
    }
    if (emoji == "🟠") {
      reaction.users.remove(user);
      if (data.public.length)
        return message.channel.send(
          `${user}, this suggestion has already been sent to the public!\n${data.public}`
        );
      const msg = await message.channel.send(
        `Where would you like to ask the public on whether or not \`#${padWithLeadingZeroese(
          data.tag,
          4
        )}\` should be added?`
      );
      const filter = (m) => m.author.id == user.id && !m.deleted;
      const collection = await message.channel.awaitMessages(filter, {
        max: 1,
        time: 60000,
      });
      if (!collection.size) {
        reaction.users.remove(user);
        return msg.delete().catch((err) => {
          console.log("AHA SUGGESTION ORANGE");
          console.log(err);
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
              console.log("no channel suggestion orange error", err);
            }),
          3000
        );
      }
      msg.delete().catch((err) => {
        console.log("channel suggestion orange err", err);
      });
      const m = await channel
        .send(
          message.embeds[0].setFooter(
            "React on whether or not you'd like this suggestion added!\nDo note that the final total may not be the conclusive answer on the addition of this feature."
          )
        )
        .catch((err) => {
          console.log("weird", err);
        });
      const emojis = ["👍", "👎"];
      await Promise.all(emojis.map((e) => m.react(e))).catch((err) =>
        console.log("Unsure what happened,", err)
      );
      new MongoTicket(message.guild.id, message.id).set({
        property: "public",
        toSet: m.url,
      });
      const requester = await client.users.fetch(data.authorId).catch(() => {
        return;
      });
      const publicvoteembled = new MessageEmbed()
        .setColor("#ab9b54")
        .setTitle(
          `Your suggestion *${data.title}* has been released for a public vote!`
        )
        .setDescription(
          `Your suggestion ${data.title} for ${data.game} has been released for a public vote! The Community is now voting on your suggestion, I will notify you again, if your suggestion has been declined or accepted.`
        );
      requester.send(publicvoteembled).catch(() => {
        return;
      });
      return message.edit(
        message.embeds[0]
          .addField("Currently being voted on", m.url)
          .setFooter("")
      );
    }
    // Decline
    if (emoji == "🔴") {
      const collector = message.channel.createMessageCollector(
        (msg) => msg.author.id === user.id,
        { time: 3e5 }
      );
      message.channel
        .send(
          "Please provide a reason for declining or type `none` to send the default message."
        )
        .then(
          (sentMessage) =>
            sentMessage.deletable && sentMessage.delete({ timeout: 10000 })
        );
      collector.on("collect", async (msg) => {
        const { content } = msg;
        const isCustom = content.toLowerCase() !== "none";
        message.delete().catch((err) => {
          console.log("AHA SUGGEST RED!!!");
          console.log(err);
        });
        new MongoTicket(guild.id, data.messageId).delete();
        const user2 = await client.users.fetch(data.authorId).catch(() => {
          return;
        });
        if (user2) {
          const suggestiondeclinedembled = new MessageEmbed()
            .setColor("#6e6e6e")
            .setTitle(`Your suggestion *${data.title}* has been declined`)
            .setDescription(
              `Your suggestion ${data.title} has unfortunately been declined, but don't be discouraged! Feel free to send another suggestion if you have any in mind, we're looking forward to your next idea!`
            );

          !isCustom &&
            suggestiondeclinedembled.addField(
              "\u200b",
              `**Common reasons for a decline are:**\n- The Title does not provide a short description of your suggestion\n- Your suggestion has too many grammatical mistakes\n- Your Description is too short`
            );
          isCustom &&
            suggestiondeclinedembled
              .addField("Reason:", `> ${content}`)
              .addField("Issuer:", `> ${user.tag}`);
          //user.send(`Your suggestion *${data.title}* has unfortunately been declined, but don't be discouraged! Feel free to send another suggestion if you have any in mind, we're looking forward to your next idea!`).catch(() => { return })
          user2.send(suggestiondeclinedembled).catch(() => {
            return;
          });
        }
        msg.deletable && msg.delete({ timeout: 5000 });
        collector.stop();
      });
    }
  }
  if (data.type == "report") {
    // Decline
    if (emoji == "⚫") {
      const collector = message.channel.createMessageCollector(
        (msg) => msg.author.id === user.id,
        { time: 3e5 }
      );
      message.channel
        .send(
          "Please provide a reason for declining or type `none` to send the default message."
        )
        .then(
          (sentMessage) =>
            sentMessage.deletable && sentMessage.delete({ timeout: 10000 })
        );
      collector.on("collect", async (msg) => {
        const { content } = msg;
        const isCustom = content.toLowerCase() !== "none";
        message.delete().catch((err) => {
          console.log("AHA REPORT BLACK!!!");
          console.log(err);
        });
        new MongoTicket(guild.id, data.messageId).delete();
        const user2 = await client.users.fetch(data.authorId).catch(() => {
          return;
        });
        if (user2) {
          //user.send(`Your report *${data.title}* has unfortunately been declined, but don't be discouraged! Feel free to send another report if you found any!`).catch(() => { return })
          const reportdeclinedembled = new MessageEmbed()
            .setColor("#6e6e6e")
            .setTitle(`Your bug report *${data.title}* has been declined`)
            .setDescription(
              `Your bug report ${data.title} has unfortunately been declined, but don't be discouraged! Feel free to send another report if you found any bugs! We're always looking forward to improving ${data.game}!`
            );

          !isCustom &&
            reportdeclinedembled.addField(
              "\u200b",
              `**Common reasons for a decline are:**\n- The Title does not provide a short description of your report\n- Your report has too many grammatical mistakes\n- Your Description is too short\n- We could not replicate the bug\n- The reported bug is not a bug`
            );
          isCustom &&
            reportdeclinedembled
              .addField("Reason:", `> ${content}`)
              .addField("Issuer:", `> ${user.tag}`);
          user2.send(reportdeclinedembled).catch(() => {
            return;
          });
        }
        msg.deletable && msg.delete({ timeout: 5000 });
        collector.stop();
      });
    } else {
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

      const todo = guild.channels.cache.get(guild.database.todoch);
      if (!todo)
        return user
          .send("The to-do channel has not been set yet.")
          .catch(() => {
            return;
          });
      const noPermissionsEmbed = new MessageEmbed()
        .setColor("RED")
        .setTitle("Missing permissions")
        .setTimestamp()
        .setThumbnail(message.guild.iconURL({ dynamic: true }))
        .setDescription(
          `*I am unable to post to ${todo}. I need permissions to \`SEND_MESSAGES\` in there to work properly.*`
        )
        .addField("Please contact an admin", "> Sorry for the inconvenience.");
      if (!message.guild.me.permissionsIn(todo).has("SEND_MESSAGES"))
        return message.reply(noPermissionsEmbed);

      new MongoTicket(guild.id, message.id).set({
        property: "status",
        toSet: "todo",
      });
      message.delete().catch((err) => {
        console.log("AHA REPORT NOT BLACK!!!");
        console.log(err);
      });

      const fields = [
        message.embeds[0].fields[0],
        message.embeds[0].fields[1],
        message.embeds[0].fields[2],
        { name: "Severity", value: severity, inline: true },
        { name: "Reserved by", value: "Nobody" },
        message.embeds[0].fields[3],
        message.embeds[0].fields[4],
      ];
      message.embeds[0].spliceFields(
        0,
        message.embeds[0].fields.length,
        fields
      );

      const msg = await todo.send(message.embeds[0].setColor(color));
      const emojis = ["📥", "📙", "🟢", "🟠", "🔴", "🏁", "⚫"];
      await Promise.all(emojis.map((e) => msg.react(e))).catch((err) =>
        console.log("Someone reacted too quickly.")
      );

      new MongoTicket(guild.id, message.id).set({
        property: "messageId",
        toSet: msg.id,
      });

      const user = await client.users.fetch(data.authorId).catch(() => {
        return;
      });
      if (user) {
        //user.send(`Your report *${data.title}* has been accepted!`).catch(() => { return })
        const suggestionacceptedmbled = new MessageEmbed()
          .setColor("#5eab54")
          .setTitle(`Your report *${data.title}* has been accepted`)
          .setDescription(
            `Your bug report ${data.title} for ${data.game} has been accepted and has been ranked as ${severity} class priority bug. We are doing our best to fix your found bug as fast as possible. In the meantime feel free to send another bug report if you find any!`
          );
        user.send(suggestionacceptedmbled).catch(() => {
          return;
        });
      }
    }
  }
};
