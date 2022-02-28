const Discord = require("discord.js")
const client = new Discord.Client({
  intents: [
    "GUILDS",
    "GUILD_MESSAGES"
  ]
});
require('dotenv').config()

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on("messageCreate", msg => {
  if (msg.content === ""){
    client.channels.cache.get("").send("$aiode play ")
    return;
  }
})

client.login(process.env.TOKEN)