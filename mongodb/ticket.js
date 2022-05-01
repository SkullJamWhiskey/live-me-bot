const mongoose = require('mongoose')
const str = {type:String,default: ''}
const num = {type:Number, default: 0}
const arr = {type:Array}
const schema = mongoose.Schema({
    guildId: str,
    messageId: str,
    authorId: str,
    tag: num,
    game: str,
    title: str,
    bug: str,
    description: str,
    screenshots: arr,
    moderators: arr,
    public: str,
    type: str,
    status: {type:String,default:'pending'}
})
module.exports = mongoose.model('ticket', schema)