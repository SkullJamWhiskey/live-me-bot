const { MessageEmbed } = require("discord.js")
const { default: padWithLeadingZeroese } = require("leading-zeroes")
const MongoGuild = require("../../library/guild")
const MongoSuggest = require("../../library/ticket")
const pending = new Map()

module.exports = {
    name: 'suggest',
    aliases: ["suggestion", "feature","feature-request","request"],
    description: "Invites the Bot to a other Server",
    run: async function (message, args) {
        const { author, guild } = message

        const headch = guild.channels.cache.get(guild.database.headch)
        if (!headch) return message.reply("there is no holding channel set for your suggestions to be reviewed.")
        const noPermissionsEmbed = new MessageEmbed()
            .setColor("RED")
            .setTitle("Missing permissions")
            .setTimestamp()
            .setThumbnail(message.guild.iconURL({dynamic: true}))
            .setDescription(`*I am unable to post to ${headch}. I need the following permissions to work properly:*\n\n\`SEND_MESSAGES\`\n\`VIEW_CHANNEL\`\n\`ADD_REACTIONS\``)
            .addField("Please contact an admin","> Sorry for the inconvenience.")
        if(!message.guild.me.permissionsIn(headch).has("SEND_MESSAGES" && "VIEW_CHANNEL")) return message.reply(noPermissionsEmbed)

        const pend = pending.get(author.id)
        const pendingembled = new MessageEmbed()
            .setColor('RED')
            .setTitle('You already have a pending suggestion!')
            .setDescription(`You already have a pending [suggestion here](${pend})\nComplete that first before suggesting a new feature.`)
            .setAuthor(author.tag, author.displayAvatarURL({ dynamic: true }))
        //if (pend) return message.reply(`you already have a pending suggestion [here](${pend})! Complete that first before suggesting a new feature.`)
        if (pend) return message.reply(pendingembled)

        if (!guild.database.games.length) return message.reply(`there currently aren't any games to suggest for.`)
        const games = []
        for (i = 0; i < guild.database.games.length; i++) games.push(`**${i + 1}.** ${guild.database.games[i]}`)

        const number = guild.database.suggest
        const embed = new MessageEmbed()
            .setColor('BLUE')
            .setTitle(`Feature Request #${padWithLeadingZeroese(number, 4)}`)
            .setAuthor(author.tag, author.displayAvatarURL({ dynamic: true }))
        const msg = await author.send("What's the title of this suggestion?\nIt cannot be more than 256 characters.\nUse `cancel` to cancel your suggestion.", embed).catch(() => { return })
        if (!msg) return message.reply(`I can't message you if your DMs are disabled, you must have them enabled to suggest a feature!`)

        pending.set(author.id, msg.url)
        guild.database.suggest++
        new MongoGuild(guild.id).inc({ property: 'suggest' })

        let counter = -1
        const data = {
            tag: number,
            type: 'suggestion',
            authorId: message.author.id,
            game: '',
            title: '',
            description: '',
            screenshots: [],
            moderators: []
        }

        const questions = ["Please state the game, or its game number, that you want to suggest for.\n\n**GAMES**\n"+games.join('\n')+"\n\nUse `cancel` to cancel your suggestion.", "Describe your suggestion as closely as you can.\nIt cannot be more than 1024 characters.\nUse `cancel` to cancel your suggestion.", "If you have any screenshots, please provide them now. Once you're done or if you have none, type \`done\`\nWe only accept files that are either gif, png, jpg or jpeg."]
        const filter = m => !m.author.bot
        const collector = msg.channel.createMessageCollector(filter, { time: 3.6e+6 })
        collector.on('collect', function (m) {
            const { content } = m
            counter++
            // Checks if User whish to cancel the report
            if(content == "cancel"){
                return collector.stop({ reason: 'cancel' })
            }
            if (counter == 0) {
                data.title = content.slice(0, 256)
                embed.addField("Feature Title", data.title)
            }
            if (counter == 1) {
                let game = ''
                if (content.includes(guild.database.games)) game = content
                else {
                    const number = Math.floor(content)
                    if (isNaN(number) || number < 1 || number > guild.database.games.length) {
                        counter--
                        return msg.edit(`State the name of the game you want to suggest for, or type out its game number between **1** and **${guild.database.games.length}**\n\n**GAMES**\n${games.join('\n')}`)
                    }
                    game = guild.database.games[number - 1]
                }
                data.game = game
                embed.addField("Game", data.game)
            }
            if (counter == 2) {
                data.description = content.slice(0, 1024)
                embed.addField("Feature Description", data.description)
            }
            if (counter >= 3) {
                if (content.toLowerCase() == 'done') return collector.stop({ reason: 'fin' })
                const attachments = getAttachments(m.attachments)
                for (const attachment of attachments) data.screenshots.push(attachment)
            }
            return msg.edit(questions[counter], embed)
        }).on('end', async function (d, { reason }) {
            pending.delete(author.id)
            if (!reason) return msg.edit("You took too long", { embed: null })
            // Cancel report
            if (reason == 'cancel'){
                msg.edit('You have canceled your suggestion!', { embed: null })
            }
            if (reason == 'fin') {
                const m = await headch.send(embed.addField("Screenshots", data.screenshots.join('\n').slice(0, 1024) || "None").setTimestamp().setThumbnail(message.client.config.images.suggestion))
                new MongoSuggest(message.guild.id, m.id).create(data)
                const emojis = ['🟢', '🟠', '🔴']
                await Promise.all(emojis.map(e => m.react(e)))
                    .catch((err)=> console.log("Someone reacted too quickly."))
                msg.edit('Your suggestion has been sent!', { embed: null })
            }
        })
    }
}

function getAttachments(attachments) {
    const regex = /^.*(gif|png|jpg|jpeg)$/g
    return attachments.filter(a => regex.test(a.url)).map(a => a.url)
}