/* eslint-disable no-undef */
require('dotenv').config();

const humanizeDuration = require("humanize-duration");

const dayjs = require('dayjs');
const UTC = require('dayjs/plugin/UTC');
const advancedFormat = require('dayjs/plugin/advancedFormat');
dayjs.extend(UTC);
dayjs.extend(advancedFormat)

const riot_key = process.env.API_KEY;
const bot_key = process.env.TOKEN;
const channel_id = process.env.CHANNEL_ID;
const owner = process.env.OWNER;
const prefix = '=';

const Discord = require("discord.js");
const client = new Discord.Client({intents: ["GUILDS","GUILD_MESSAGES","GUILD_EMOJIS_AND_STICKERS"]});
const axios = require('axios');
const fs = require('fs');
const path = require('path');

let {players} = require('./data/players.json');

const timeForInterval = (3*players.length)*1000 

client.on("ready", () => {
  console.log(`bot online`)
})

client.on("messageCreate", message =>  {
  if(!message.content.startsWith(prefix) || 
  message.author.bot || 
  message.channel.name === 'general' ||
  message.author.username !== owner) return;

  // takes message and slices off the prefix, then splits the string into an array with 2 values, the 'add' command and 'summonerName' argument
  const args = message.content.slice(prefix.length).split(/ +/);
  
  const command = args.shift().toLowerCase(); //removes and returns first item from array which will be 'add' 
  const summoner = args.pop().toLowerCase(); //removes and returns last item from array which will be the summoner name 
  
   if (command === "add"){
    const channel = client.channels.cache.get(channel_id);

    const existingPlayers = JSON.stringify(players);
    if(existingPlayers.includes(summoner)) return channel.send('Summoner already added.');

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
        path.join(__dirname, './data/players.json'),
        JSON.stringify({players}, null, 2)
      );
      channel.send("added summoner")
    })
    .catch(function (error) {
      console.log(error);
      channel.send("summoner not found")
    });
    return;
  }

  if (command === 'remove'){
    const channel = client.channels.cache.get(channel_id);

    const existingPlayers = JSON.stringify(players)
    if(!existingPlayers.includes(summoner)) return channel.send("Summoner not found.")

    const filteredPlayers = players.filter(selectedPlayer => selectedPlayer.summonerName != summoner);
    players = filteredPlayers;

    fs.writeFileSync(
        path.join(__dirname, './data/players.json'),
        JSON.stringify({players}, null, 2)
    );
    channel.send("removed summoner");
    return;
  }
});

var count = 0
const interval = () => {
  players.forEach(e => {
  axios({
    method: 'get',
    url: `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${e.puuid}/ids?type=ranked&start=0&count=1&api_key=${riot_key}`,
    headers: { }
  })
  .then(function (response) {
    axios({
      method: 'get',
      url: `https://americas.api.riotgames.com/lol/match/v5/matches/${response.data}?api_key=${riot_key}`,
      headers: {}
    })
    .then(function (matchData) {
      let summonerIndex = [];
      for (let i = 0; i < matchData.data.info.participants.length; i++) {
        const checkSummoner = matchData.data.info.participants[i].puuid
        checkSummoner === e.puuid ? summonerIndex.push('true') : summonerIndex.push('false')
      }
      summonerIndex = summonerIndex.indexOf('true');

      const currentTime = dayjs().utc().local().format('x');
      
      const gameEndTime = matchData.data.info.gameEndTimestamp;
      const timeRange = timeForInterval*1.666667;
      const gameEndTimeUpper = gameEndTime + timeRange;
      const gameEndTimeLower = gameEndTime - timeRange;

      const gameWin = matchData.data.info.participants[summonerIndex].win;
      const gameTimePlayed = humanizeDuration((matchData.data.info.participants[summonerIndex].timePlayed)*1000);
      
      const channel = client.channels.cache.get(channel_id);
      const KEKW = client.emojis.cache.find(emoji => emoji.name === "KEKW");

      if (currentTime>gameEndTimeLower && currentTime<gameEndTimeUpper) {
        if(!gameWin){
          channel.send(`${KEKW} Hey everyone! ${e.summonerName} just wasted ${gameTimePlayed} of their life by losing an ARAM game! Make fun of them! ${KEKW}`);
        }
      } 
    })
    .catch(function (error) {
      console.log(error);
    });
  });
  });
  console.log(count++);
};

setInterval(interval, timeForInterval);

client.login(bot_key);