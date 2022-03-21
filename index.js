require('dotenv').config();

const riot_key = process.env.API_KEY;
const bot_key = process.env.TOKEN;
const channel_id = process.env.CHANNEL_ID;
const prefix = '-';

const Discord = require("discord.js");
const client = new Discord.Client({intents: ["GUILDS","GUILD_MESSAGES"]});
const axios = require('axios')

const {players} = require('./data/players.json');

// // returns object that has puuid
// `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summoner}?api_key=${riot_key}`
// // returns object with matchid
// `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?type=ranked&start=0&count=1&api_key=${riot_key}`
// // returns object with all stats from that game
// `https://americas.api.riotgames.com/lol/match/v5/matches/${matchid}?api_key=${riot_key}`

client.on("ready", () => {
  console.log(`bot online`)
})

client.on("messageCreate", message => {
  if(!message.content.startsWith(prefix) || message.author.bot || message.channel.name === 'general') return;

  // takes message and slices off the prefix, then splits the string into an array with 2 values, the 'add' command and 'summonerName' argument
  const args = message.content.slice(prefix.length).split(/ +/);
  
  const command = args.shift().toLowerCase(); //removes and returns first item from array which will be 'add' 
  const summoner = args.pop().toLocaleLowerCase(); //removes and returns last item from array which will be the summoner name 
  
  if (command === "add"){
    axios({
      method: 'get',
      url: `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summoner}?api_key=${riot_key}`,
      headers: { }
    })
    .then(function (response) {
      console.log(JSON.stringify(response.data.puuid));
    })
    .catch(function (error) {
      console.log(error);
    });
    
    client.channels.cache.get(channel_id).send("works")
    return;
  }
})

// setInterval(checkPlayer, 2000)

// const checkPlayer = () =>{

// }
client.login(bot_key)