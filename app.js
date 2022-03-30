require('dotenv').config();

const dayjs = require('dayjs');
const UTC = require('dayjs/plugin/UTC');
var localizedFormat = require('dayjs/plugin/localizedFormat');
dayjs.extend(localizedFormat);
dayjs.extend(UTC);

// eslint-disable-next-line no-undef
const riot_key = process.env.API_KEY;
// eslint-disable-next-line no-undef
const bot_key = process.env.TOKEN;
// eslint-disable-next-line no-undef
const channel_id = process.env.CHANNEL_ID;
const prefix = '=';

const Discord = require("discord.js");
const client = new Discord.Client({intents: ["GUILDS","GUILD_MESSAGES"]});
const axios = require('axios');
const fs = require('fs');
const path = require('path');

let {players} = require('./data/players.json');


// // returns object that has puuid
// `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summoner}?api_key=${riot_key}`
// // returns object with matchid
// `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?type=ranked&start=0&count=1&api_key=${riot_key}`
// // returns object with all stats from that game
// `https://americas.api.riotgames.com/lol/match/v5/matches/${matchid}?api_key=${riot_key}`

client.on("ready", () => {
  console.log(`bot online`)
})

client.on("messageCreate", message =>  {
  if(!message.content.startsWith(prefix) || message.author.bot || message.channel.name === 'general') return;

  // takes message and slices off the prefix, then splits the string into an array with 2 values, the 'add' command and 'summonerName' argument
  const args = message.content.slice(prefix.length).split(/ +/);
  
  const command = args.shift().toLowerCase(); //removes and returns first item from array which will be 'add' 
  const summoner = args.pop().toLowerCase(); //removes and returns last item from array which will be the summoner name 
  
   if (command === "add"){
    const channel = client.channels.cache.get(channel_id);

    const existingPlayers = JSON.stringify(players);
    if(existingPlayers.includes(summoner)) return channel.send("Summoner already added.");

    axios({
      method: 'get',
      url: `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summoner}?api_key=${riot_key}`,
      headers: { }
    })
    .then(function (response) {
      if (!players){
        players = [];
      }

      const summonerPuuid = response.data.puuid;

      let playerObj = {
        summonerName:`${summoner}`,
        puuid:`${summonerPuuid}`
      };

      players.push(playerObj);

      fs.writeFileSync(
        // eslint-disable-next-line no-undef
        path.join(__dirname, './data/players.json'),
        JSON.stringify({players}, null, 2)
      );
      channel.send("added summoner")
    })
    .catch(function (error) {
      console.log(error);
      channel.send("summoner not found")
    });
    // clearInterval(interval);
    // interval();
    return;
  }

  if (command === 'remove'){
    const channel = client.channels.cache.get(channel_id);

    const existingPlayers = JSON.stringify(players)
    if(!existingPlayers.includes(summoner)) return channel.send("Summoner not found.")

    const filteredPlayers = players.filter(selectedPlayer => selectedPlayer.summonerName != summoner);
    players = filteredPlayers;

    fs.writeFileSync(
        // eslint-disable-next-line no-undef
        path.join(__dirname, './data/players.json'),
        JSON.stringify({players}, null, 2)
    );
    // clearInterval(interval);
    // interval();
    channel.send("removed summoner");
    return;
  }
});

// const test = () => {
//   console.log(dayjs(1645938093697).utc().local().format('lll'))
// };

// const interval = () => {
//   setInterval(test, 1000)
// };

// interval();

client.login(bot_key)