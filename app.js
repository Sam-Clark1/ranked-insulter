/* eslint-disable no-undef */
require('dotenv').config();

const humanizeDuration = require("humanize-duration");

const dayjs = require('dayjs');

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

const timeForInterval = (3*players.length)*1000;

let intervalStatus;

client.on("ready", () => {
  console.log(`bot online`)
})

// All commands for this bot
client.on("messageCreate", message =>  {
  if(!message.content.startsWith(prefix) || 
  message.author.bot || 
  message.channel.name === 'general' ||
  message.author.username !== owner) return;

  // takes message and slices off the prefix, then splits the string into an array with 2 values, the 'add' command and 'summonerName' argument
  const args = message.content.slice(prefix.length).split(/ +/);
  
  const command = args.shift().toLowerCase(); //removes and returns first item from array which will be 'add' 
  const summoner = args.pop().toLowerCase(); //removes and returns last item from array which will be the summoner name 
  
  // Command to add a summoner to database
   if (command === "add"){
    const channel = client.channels.cache.get(channel_id);
    const existingPlayers = JSON.stringify(players);

    if (!intervalStatus) {
      if (players.length < 6) {
        if(existingPlayers.includes(summoner)) {
          channel.send('Summoner already added.');
        } else {
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
          }
        } else {
          channel.send("Max number of player added (6)");
        }
    } else {
      channel.send("!Turn bot off with '=bot stop' before adding or removing summoners!");
    }
  }

  // Command to remove a summoner from database
  if (command === 'remove'){
    const channel = client.channels.cache.get(channel_id);
    const existingPlayers = JSON.stringify(players);

    if (!intervalStatus) {
      if (players.length > 0) {
        if(!existingPlayers.includes(summoner)) {
          channel.send("Summoner not found.")
        } else {
            const filteredPlayers = players.filter(selectedPlayer => selectedPlayer.summonerName != summoner);
            players = filteredPlayers;
        
            fs.writeFileSync(
                path.join(__dirname, './data/players.json'),
                JSON.stringify({players}, null, 2)
            );
            channel.send("removed summoner");
        }
      } else {
        channel.send("No stored summoners. Use '=add <summoner name>' to add a summoner.")
      }
    } else {
      channel.send("!Turn bot off with '=bot stop' before adding or removing summoners!");
    } 
  }

  // Command to start interval to check each summoner in database for recent games and win/loss status
  if (command === "bot" && summoner === "start") {
    const channel = client.channels.cache.get(channel_id);
    if (players.length > 0) {
      if(!intervalStatus) {
        intervalStatus = setInterval(interval, timeForInterval);
        channel.send("Bot started")
      } else {
        channel.send("Bot is already on!")
      }
    } else {
      channel.send("No stored summoners. Must add a summoner with '=add <summoner name>' to turn bot on.")
    }
  }

  // Command to stop bot interval. Bot must be off to add or remove summoners from database
  if (command === 'bot' && summoner === 'stop') {
    const channel = client.channels.cache.get(channel_id);
    if (!intervalStatus) {
      channel.send("Bot is already off!")
    } else {
      clearInterval(intervalStatus);
      intervalStatus = null;
      channel.send("Bot stopped")
    }
  }

  // Displays if bot interval is on or off
  if (command === 'bot' && summoner === 'status') {
    const channel = client.channels.cache.get(channel_id);
    if (!intervalStatus) {
      channel.send("Bot Status: OFF")
    } else {
      channel.send("Bot Status: ON")
    }
  }

  // Displays currently stored summoners in database
  if (command === 'current' && summoner === 'summoners') {
    const channel = client.channels.cache.get(channel_id);
    let currentSummoners = '';
    if (players.length > 0) {
      players.forEach((e, i) => {
        currentSummoners += `${i + 1}. ${e.summonerName}\n`;
      })
      channel.send(currentSummoners)
    } else {
      channel.send("No stored summoners. Use '=add <summoner name>' to add a summoner.")
    }
  }

  // Displays a list of available commands for this bot
  if (command === 'bot' && summoner === 'help') {
    const channel = client.channels.cache.get(channel_id);
    channel.send("List of Avaliable Commands:\n 1. =add <summoner name>  --> Adds a summoner to database to be checked\n 2. =remove <summoner name>  --> Removes a summoner from database\n 3. =bot start  --> Starts interval to check each stored summoners most recent ranked game\n 4. =bot stop  --> Stops interval that checks each summoner in database\n 5. =bot status  --> Tells you if interval is on or off\n 6. =current summoners  --> Displays currently stored summoners in database\n 7. =bot help  --> Displays a list of commands for this bot ")
  }

});

// Interval that uses axios to access RIOT API to determine if a summoner stored in database has just won or lost a ranked game
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

      const currentTime = dayjs().valueOf();
      
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
          channel.send(`${KEKW} Hey everyone! ${e.summonerName} just wasted ${gameTimePlayed} of their life by losing a ranked game! Make fun of them! ${KEKW}`);
        }
      } 
    })
      .catch(function (error) {
        console.log(error);
      });
    }).catch(function (error) {
      console.log(error);
    });
  });
};

client.login(bot_key);