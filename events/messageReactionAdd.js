module.exports = async function(client, reaction, user) {
    if (user.bot) return
    if (reaction.partial) await reaction.fetch()
    if (reaction.message.partial) await reaction.message.fetch()

    require('../reaction/pending')(client, reaction, user)
    require('../reaction/todo')(client, reaction, user)
}