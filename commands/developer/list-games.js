module.exports = {
    name: 'list-games',
    aliases: ['listgames', 'games', 'listgame', 'list-game'],
    description: "Shows the list of games",
    run: async function(message) {
        if (message.guild.ownerID !== message.author.id && !message.member.permissions.has('ADMINISTRATOR')) {
            const role = message.guild.roles.cache.get(message.guild.database.headrole)
            if (!role) return message.reply(`there currently isn't a head-developer-role set, please contact the owner of the server.`).catch(()=>{return})
            if (!message.member.roles.cache.has(role.id)) return message.reply(`you are not a head developer.`).catch(()=>{return})
        }
        
        const games = message.guild.database.games.join('\n') || "There isn't any at the moment!"
        return message.channel.send(`You can add games with \`${message.client.config.prefix}add-game\`\nYou can also remove games with \`${message.client.config.prefix}delete-game\`\n\n**GAMES**\n${games}`)
    }
}