const mongo = require('../mongo')
const schema = require('../mongodb/guild')
module.exports = class MongoGuild {
    constructor(id) {
        this.id = id
    }
    async get(all = false) {
        await mongo()
        if (all) return await schema.find()
        let data = await schema.findOne({ id: this.id })
        if (!data) data = await new schema({ id: this.id }).save()
        return data
    }
    /**
     * @param {*} data { property: "string", toInc: 1 }
     */
    async inc(data) {
        const { property, toInc = 1 } = data
        const object = { $inc: {} }
        object.$inc[property] = toInc
        await mongo()
        return await schema.findOneAndUpdate({ id: this.id }, object, { upsert: true, new: true })
    }
    /**
     * @param {*} data { property: "string", toSet } 
     */
    async set(data) {
        const { property, toSet } = data
        const object = { $set: {} }
        object.$set[property] = toSet
        await mongo()
        return await schema.findOneAndUpdate({ id: this.id }, object, { upsert: true, new: true })
    }
    /**
     * @param {*} data { property: "string", toPush } 
     */
    async push(data) {
        const { property, toPush } = data
        const object = { $push: {} }
        object.$push[property] = toPush
        await mongo()
        return await schema.findOneAndUpdate({ id: this.id }, object, { upsert: true, new: true })
    }
    /**
     * @param {*} data { property: "string", toPull } 
      */
    async pull(data) {
        const { property, toPull } = data
        const object = { $pull: {} }
        object.$pull[property] = toPull
        await mongo()
        return await schema.findOneAndUpdate({ id: this.id }, object, { upsert: true, new: true })
    }

    async delete() {
        await mongo()
        return await schema.findOneAndDelete({ id: this.id })
      }
}