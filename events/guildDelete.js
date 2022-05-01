const MongoGuild = require('../library/guild')
module.exports = async function(client, guild){
new MongoGuild(guild.id).delete()
}