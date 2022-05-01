const MongoGuild = require("../../library/guild")
module.exports = {
    name: 'add-game',
    minArgs: 1,
    expectedArgs: '<game>',
    description: "Adds a game to the database",
    run: async function(message) {
        if (message.guild.ownerID !== message.author.id && !message.member.permissions.has('ADMINISTRATOR')) {
            const role = message.guild.roles.cache.get(message.guild.database.headrole)
            if (!role) return message.reply(`there currently isn't a head-developer-role set, please contact the owner of the server.`).catch(()=>{return})
            if (!message.member.roles.cache.has(role.id)) return message.reply(`you are not a head developer.`).catch(()=>{return})
        }

        const string = `${message.client.config.prefix}${this.name} `
        const game = message.content.slice(string.length, message.content.length)
        if (message.guild.database.games.includes(game)) return message.channel.send(`**${game}** is already an existing game.`)

        message.guild.database = await new MongoGuild(message.guild.id).push({ property: 'games', toPush: game })
        return message.channel.send(`Added **${game}** to the database, members can now pick this game when they want to suggest or report.`)
    }
}