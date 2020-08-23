const { MessageEmbed } = require("discord.js");
const request = require('request-promise');
const { THAIPOST_API_KEY } = require("../config.json");

module.exports = {
  name: "thaipost",
  aliases: ["track"],
  description: "Tracking ThaiPost parcels",
  async execute(message, args) {
    let parcelcode = args;
    gettrack(message, parcelcode);
  }
};

// modified source from https://github.com/PamornT/line-thaipost

async function gettrack(message, parcelid)
{
    message.react('⌛');
    let promise_token = new Promise(resolve => {
        var options = {
            method: 'POST',
            uri: 'https://trackapi.thailandpost.co.th/post/api/v1/authenticate/token',
            strictSSL: false,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Token ' + THAIPOST_API_KEY
            }
        };
        
        request(options, function(error, response, body) {
            resolve(JSON.parse(body));
        });
    });
    
    let access_token = await promise_token;
    let params = {
        "status": "all",
        "language": "TH",
        "barcode": [
            `${parcelid}`
        ]
    };
    let promise_track = new Promise(resolve => {
        var options = {
            method: 'POST',
            uri: 'https://trackapi.thailandpost.co.th/post/api/v1/track',
            strictSSL: false,
            body: JSON.stringify(params),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Token ' + access_token.token
            }
        };
        
        request(options, function(error, response, body) {
            resolve(JSON.parse(body));
        });
    });
    let tracks = await promise_track;
        
    let { response } = tracks;
    let { items } = response;
    let key = Object.keys(tracks.response.items);

    let embedcolor;

    let trackembed = new MessageEmbed()
      .setTitle(parcelid)
      .setFooter(`Requested by ${message.author.tag}`);
    if (items[key[0]].length > 0) {
        items[key[0]].forEach(function(detail) {
            if(detail.delivery_status === 'S')
            {
                embedcolor = "#32CD32"; // Lime Green
            }
            else{
                embedcolor = "#FE0000"
            }
            trackembed.addField(
                "⌚ Date: ",
                detail.status_date,
                true
            );
            trackembed.addField(
                "📝 Status: ",
                detail.status_description,
                true
            );
            trackembed.addField(
                "📍 Location: ",
                detail.location,
                true
            );
        });
        trackembed.setColor(embedcolor);
        message.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
        message.react('✅');
        message.channel.send(trackembed);
    } else {
        message.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
        message.react('❎');
        message.channel.send("There's no item number ;w;" + " <@" + message.author.id + ">");
    }
}