const mongoose = require('mongoose')
const str = { type: String, default: '' }
const num = {type:Number, default: 1 }
const arr = { type: Array }
const schema = mongoose.Schema({
    id: str,
    suggest: num,
    report: num,
    headch: str,
    todoch: str,
    games: arr,
    headrole: str,
    prefix: { type: String, default: "-"}
})
module.exports = mongoose.model('guild', schema)