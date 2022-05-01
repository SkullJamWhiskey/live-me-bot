const mongo = require('../mongo')
const schema = require('../mongodb/ticket')
module.exports = class MongoTicket {
    constructor(guildId, messageId) {
        this.guildId = guildId
        this.messageId = messageId
    }
    /**
     * @param {*} data messageId: String | { all: Boolean, guild: Boolean } 
     */
    async get(data) {
        await mongo()
        if (typeof data == 'string') return await schema.findOne({ messageId: data.messageId || this.messageId })
        const { all, guild } = data
        if (all) return await schema.find()
        if (guild) return await schema.find({ guildId: this.guildId })
    }
    async create(data) {
        const { messageId, tag, game, title, description, screenshots, type, authorId, moderators, bug } = data
        await mongo()
        return await schema.create({ guildId: this.guildId, messageId: messageId || this.messageId, moderators, tag, game, title, description, screenshots, type, authorId, bug })
    }
    /**
     * @param {*} data { messageId: "String", property: "String", toSet } 
     */
    async set(data) {
        const { property, toSet, messageId } = data
        const object = { $set: {}}
        object.$set[property] = toSet
        await mongo()
        return await schema.findOneAndUpdate({ guildId: this.guildId, messageId: messageId || this.messageId }, object, { upsert: true, new: true })
    }
    async delete(messageId) {
        await mongo()
        return await schema.findOneAndDelete({ messageId: messageId || this.messageId })
    }
    async push(data) {
        const { property, toPush, messageId } = data
        const object = { $push: {} }
        object.$push[property] = toPush
        await mongo()
        return await schema.findOneAndUpdate({ guildId: this.guildId, messageId: messageId || this.messageId }, object, { upsert: true, new: true })
    }
    /**
     * @param {*} data { property: "string", toPull } 
      */
    async pull(data) {
        const { property, toPull, messageId } = data
        const object = { $pull: {} }
        object.$pull[property] = toPull
        await mongo()
        return await schema.findOneAndUpdate({ guildId: this.guildId, messageId: messageId || this.messageId }, object, { upsert: true, new: true })
    }
    /**
     * @param {*} game The game to delete, leave empty if you want to delete everything thaet is published
     */
    async deletePublish(game) {
        await mongo()
        const data = { guildId: this.guildId, status: 'publish' }
        if (game) data.game = game
        return await schema.deleteMany(data)
    }
}