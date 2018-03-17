require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();
const Twitch = require('./twitch/announce');

client.on('ready', () => {
  console.log('I am ready.');
});

client.on('message', message => {
  if (message.content === 'ping') {
    message.reply('pong');
  }
});

client.login(process.env.APP_TOKEN)
  .then(() => {
    Twitch.init(client);
  }, () => {
    console.log('Login failed');
  });