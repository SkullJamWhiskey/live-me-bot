const { MessageEmbed } = require("discord.js")
const MongoGuild = require("../../library/guild")

module.exports = {
    name: 'set-head-dev',
    aliases: ['sethead', 'setheaddev'],
    description: "Sets the role for head developers",
    run: async function(message, args) {
        const embed = new MessageEmbed()
        if (message.guild.ownerID !== message.author.id && !message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply(`This command can only be executed by an Administrator or the Server Owner`).catch(()=>{return})
        }
        if (!args.length) {
            const role = message.guild.roles.cache.get(message.guild.database.headrole)
            if (!role) return message.reply(embed.setDescription(`There currently isn't a head-developer-role set yet`))
            else return message.reply(embed.setDescription(`Head Developer Role: ${role}`))
        }
        if (args[0].startsWith('<@&') && args[0].endsWith('>')) args[0] = args[0].replace(/\D/g, '')
        const role = message.guild.roles.cache.find(r => [r.id, r.name].includes(args[0]))
        if (!role) return message.reply(`**${args[0]}** is an invalid role`)
        
        message.guild.database = await new MongoGuild(message.guild.id).set({ property: 'headrole', toSet: role.id })
        return message.reply(embed.setDescription(`New Head Developer Role: ${role}`))
    }
}