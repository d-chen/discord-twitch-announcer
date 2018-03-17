let api = require('twitch-api-v5');
api.clientID = process.env.TWITCH_CLIENT_ID;

let channel;
let guild;

exports.init = function(client) {
  console.log('announce.js init');
  guild = client.guilds.get(process.env.GUILD);
  channel = client.channels.get(process.env.ANNOUNCE_CHANNEL);

  client.on('presenceUpdate', (oldMember, newMember) => {
    console.log('presenceUpdated');
    let oldStatus = oldMember.presence;
    let newStatus = newMember.presence;
    // let existingPosts;
      
   if (!isStreaming(oldStatus) && isStreaming(newStatus)) {
      console.log(`${newMember.user.username} is live`);
      let url = newStatus.activity.url;
      getExistingPosts(client, newMember).
        then(posts => {
          if (posts.length) {
            return;
          } else {
            updatePost(client, newMember, url);
          }
        })
        .catch(console.log);
    } else if (isStreaming(oldStatus) && !isStreaming(newStatus)) {
      console.log(`${newMember.user.username} is offline`);
      getExistingPosts(client, newMember).
        then(posts => {
          if (posts) {
            posts.forEach((post) => {
              post.delete()
              .then(msg => {
                console.log(`Deleted message`);
              })
              .catch(console.log);
            });
          }
        })
        .catch(console.log);
    }

  });
};


function isStreaming(presence) {
  if (presence.activity && presence.activity.type == 'STREAMING') {
    return true;
  } else {
    return false;
  }
}


function getExistingPosts(client, member) {
  return new Promise((resolve, reject) => {
    channel.messages.fetch({limit: 50})
      .then(messages => {
        let match = messages.filter(msg => {
          return msg.content.includes(member.user.username);
        });
        resolve(match);
      })
      .catch(console.log);
  });
}


function updatePost(client, member, url) {
  getStreamUser(url)
  .then(getStreamInfo)
  .catch(reason => {
    console.log('rejected: ', reason);
  })
  .then(streamInfo => {
    let embed = createDiscordEmbed(client, streamInfo);
    if (embed) {
      let msg = `${member.user.username} has gone live. Watch here: <${streamInfo.channel.url}>`;
      channel.send(msg, {embed: embed});
    }
  })
  .catch(reason => {
    console.log('rejected: ', reason);
  });
}


function getStreamUser(url) {
  return new Promise((resolve, reject) => {
    let index = url.lastIndexOf('/') + 1;
    let username = url.slice(index);

    api.users.usersByName({users: username}, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res.users[0]._id);
      }
    });
  });
}


function getStreamInfo(id) {
  return new Promise((resolve, reject) => {
    api.streams.channel({channelID: id}, (err, res) => {
      if (err) {
        reject(err);
      } else {
        if (res.stream) {
          resolve(res.stream);
        }
      }
    });
  });
}


function createDiscordEmbed(client, stream) {
  if (!stream) {
    return;
  }

  let embed = {
    color: 0x4b367c,
    type: 'rich',
    author: {
      name: `${stream.channel.display_name} is now streaming!`,
      icon_url: 'https://images-ext-1.discordapp.net/external/IZEY6CIxPwbBTk-S6KG6WSMxyY5bUEM-annntXfyqbw/https/cdn.discordapp.com/emojis/287637883022737418.png?width=18&height=18'
    },
    title: stream.channel.url,
    url: stream.channel.url,
    fields: [{
      name: 'Now Playing',
      value: stream.game || 'None set'
    }, {
      name: 'Stream Title',
      value: stream.channel.status
    }],
    timestamp: stream.created_at,
    thumbnail: {
      url: stream.channel.logo,
      height: 72,
      width: 72
    },
    footer: {
      text: 'Stream start time'
    }
  };
  
  return embed;
}
