const { MessageEmbed } = require("discord.js");
const ratelimits = new Map();
const humanizeDuration = require("humanize-duration");
const MongoGuild = require("../library/guild");
const { getPrefix } = require("./prefixes");
module.exports = async function (client, message) {
  const { author, member, content, channel, guild } = message;
  if (author.bot) return;

  const { prefix: defaultPrefix } = client.config;
  const customPrefix = getPrefix(message?.guild?.id);
  const prefix = customPrefix || defaultPrefix;

  if (!content.startsWith(prefix)) return;

  const embed = new MessageEmbed()
    .setColor("RED")
    .setFooter(
      `Requested by ${author.tag}`,
      author.displayAvatarURL({ dynamic: true })
    );

  const arguments = content
    .substr(content.indexOf(prefix) + prefix.length)
    .split(new RegExp(/\s+/));
  const name = arguments.shift().toLowerCase();
  const command =
    (await client.commands.get(name)) ||
    client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(name));
  if (!command) return;

  const ratelimit = ratelimits.get(author.id);
  if (ratelimit)
    return author.send(
      embed
        .setDescription(
          `You are being ratelimited! Please wait for **${humanizeDuration(
            ratelimit - Date.now()
          )}**`
        )
        .catch(() => {
          return;
        })
    );
  ratelimits.set(author.id, Date.now() + 1000);
  setTimeout(() => ratelimits.delete(author.id), 1000);

  let {
    permissions,
    clientPermissions,
    ownerOnly,
    clientOnly,
    minArgs,
    maxArgs,
    expectedArgs,
    dmAllowed,
    hidden,
  } = command;

  if (!guild) {
    // If it's not dm only
    if (!dmAllowed) return;
  }
  if (guild) {
    if (!guild.me.permissions.has("SEND_MESSAGES")) return;
    // Guild Owner
    if (ownerOnly && member.id !== guild.ownerID) return;
    // If permissions are required
    if (permissions) {
      const missingPermissions = [];
      if (typeof permissions == "string") permissions = [permissions];
      for (const permission of permissions)
        if (!member.permissions.has(permission))
          missingPermissions.push(`\`${permission}\``);
      if (missingPermissions.length)
        return channel.send(
          member,
          embed.setDescription(
            `**You are missing the following permissions:** ${missingPermissions.join(
              ", "
            )}`
          )
        );
    }
    // If client permissions are required
    if (clientPermissions) {
      const missingPermissions = [];
      if (typeof clientPermissions == "string")
        clientPermissions = [clientPermissions];
      for (const permission of clientPermissions)
        if (!guild.me.permissions.has(permission))
          missingPermissions.push(`\`${permission}\``);
      if (missingPermissions.length)
        return channel.send(
          member,
          embed.setDescription(
            `**I am missing the following permissions:** ${missingPermissions.join(
              ", "
            )}`
          )
        );
    }
    if (!guild.database) guild.database = await new MongoGuild(guild.id).get();
  }
  // Client Owner
  if (clientOnly) {
    const { owner } = await client.fetchApplication();
    if (owner.id !== author.id) return;
  }

  // Arguments
  if (
    (minArgs && arguments.length < minArgs) ||
    (maxArgs && arguments.length > maxArgs)
  )
    return channel.send(member, {
      embed: {
        color: "RED",
        description: `**Arguments**\n\`${prefix}${name} ${expectedArgs}\``,
      },
    });
  command.run(message, arguments);
};
