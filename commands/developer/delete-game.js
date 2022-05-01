const MongoGuild = require("../../library/guild")

module.exports = {
    name: 'delete-game',
    minArgs: 1,
    expectedArgs: '<game>',
    description: "Deletes a game from the database",
    run: async function(message) {
        if (message.guild.ownerID !== message.author.id && !message.member.permissions.has('ADMINISTRATOR')) {
            const role = message.guild.roles.cache.get(message.guild.database.headrole)
            if (!role) return message.reply(`there currently isn't a head-developer-role set, please contact the owner of the server.`).catch(()=>{return})
            if (!message.member.roles.cache.has(role.id)) return message.reply(`you are not a head developer.`).catch(()=>{return})
        }
        /*const member = await message.guild.members.fetch(user.id).catch(()=>{return})
        if (!member.roles.cache.has(role.id)) return user.send(`you are not a head developer.`).catch(()=>{return})*/

        const string = `${message.client.config.prefix}${this.name} `
        const game = message.content.slice(string.length, message.content.length)
        if (!message.guild.database.games.includes(game)) return message.channel.send(`**${game}** is not an existing game.`)

        message.guild.database = await new MongoGuild(message.guild.id).pull({ property: 'games', toPull: game })
        return message.channel.send(`Removed **${game}** from the database, members can no longer pick this game when they want to suggest or report.`)
    }
}