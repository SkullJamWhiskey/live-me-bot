const MongoGuild = require('../../library/guild')
module.exports = {
    name: 'todo-channel',
    aliases: ['todochannel', 'tdch', 'todoch'],
    description: "Sets the todo channel",
    expectedArgs: '<#channel/id>',
    run: async function(message, args) {
        if (message.guild.ownerID !== message.author.id && !message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply(`This command can only be executed by an Administrator or the Server Owner`).catch(()=>{return})
        }
        if (!args.length) {
            const channel = message.guild.channels.cache.get(message.guild.database.todoch)
            if (!channel) return message.channel.send(`There currently isn't a channel set. Use \`${message.client.config.prefix}${this.name} ${this.expectedArgs}\``)
            return message.channel.send(`Todo Channel: ${channel}`)
        }
        if (args[0].startsWith('<#') && args[0].endsWith('>')) args[0] = args[0].replace(/\D/g, '')
        const channel = message.guild.channels.cache.find(ch => ch.isText && [ch.id, ch.name].includes(args[0].toLowerCase()))
        if (!channel) return message.channel.send(`**${args[0]}** is an invalid text-based channel`)

        message.guild.database = await new MongoGuild(message.guild.id).set({ property: 'todoch', toSet: channel.id })
        return message.channel.send(`New Todo Channel: ${channel}`)
    }
}