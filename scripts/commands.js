const discord = require("discord.js");
const config = require("../config.json");
const cfat = require("./postcfat.js");
const { exit } = require("process");
const promisedb = require("./promisedb.js");
const { randomInt } = require("crypto");
const { quartzconfig, getGuildProperty } = promisedb;

//add per-server water timer
const waterTime = 60; // in minutes

exports.commandfuncs = {
    say: (msg, args) => {
        msg.channel.send(args.slice(1).join(" "));
    },
    contests: (msg, args, client) => {
        cfat.postContests(msg, args);
    },
    bind: async (msg, args, client) => {
        if (args[1] == "contestRole") {
            quartzconfig.run(
                `UPDATE config 
                SET contestRole = '${msg.mentions.roles.first().id}'
                WHERE guildId = ${msg.guild.id}`
            );
            msg.channel.send(
                `contestRole changed to ${msg.mentions.roles.first().name}`
            );
        } else {
            boundChannel = await getBoundChannel(msg, client);
            if (boundChannel == msg.channel) {
                await quartzconfig.run(
                    `UPDATE config 
                    SET boundTo = NULL 
                    WHERE guildId = ${msg.guild.id}`
                );
                msg.channel.send(`Unbound from ${msg.channel}`);
            } else {
                await quartzconfig.run(
                    `UPDATE config 
                    SET boundTo = ${msg.channel.id} 
                    WHERE guildId = ${msg.guild.id}`
                );
                msg.channel.send(`Bound to ${msg.channel}`);
            }
        }
    },
    kill: (msg, args, client) => {
        if (msg.author.id == config.owner) {
            msg.channel.send("**pq me mata :((**").then(() => {
                client.destroy();
                quartzconfig.close();
                exit();
            });
        }
    },
    alert: async (msg, args, client) => {
        boundChannel = await getBoundChannel(msg, client);
        if (boundChannel == null) {
            msg.channel.send("Bind me to a channel first!");
            return;
        }
        setTimeout(() => {
            announce(msg, [
                "announce",
                "self",
                msg.author.id,
                args.slice(2).join(" "),
            ]);
        }, args[1] * 60 * 1000);
        msg.channel.send(`Alert set to ${args[1]} minutes from now`);
    },
    vielne: async (msg, args, client) => {
        msg.channel.send(
            "https://tenor.com/view/dragon-ball-dragon-super-goku-power-gif-9067607"
        );
    },
    prefix: async (msg, args, client) => {
        quartzconfig.run(`
            UPDATE config SET prefix = '${args[1]}' WHERE guildId = ${msg.guild.id}
        `);
    },
    roll: async (msg, args, client) => {
        msg.channel.send(Math.floor(Math.random() * parseInt(args[1])) + 1);
    },
};

async function getBoundChannel(msg, client, msgIsGID = false) {
    const boundId = await getGuildProperty(msg, "boundTo", msgIsGID);
    var boundChannel;
    if (boundId == null) boundChannel = null;
    else boundChannel = await client.channels.fetch(boundId);
    return boundChannel;
}

async function water(guildId, client) {
    var boundChannel = await getBoundChannel(guildId, client, true);
    if (boundChannel == null) {
        return;
    }
    boundChannel.send(`Drink water guysh`);
    setTimeout(() => {
        water(guildId, client);
    }, waterTime * 60 * 1000);
}

async function announce(msg, args, client) {
    //args: "announce", user, id, message
    var msgBody = args.slice(3).join(" ");
    var id, pingString, channel;
    switch (args[1]) {
        case "role":
            id = msg.mentions.roles.first().id;
            pingString = `<@&${id}>`;
            channel = msg.channel;
            break;

        case "contest":
            id = await getGuildProperty(msg, "contestRole");
            if (id == null) return;
            pingString = `<@&${id}>`;
            channel = await getBoundChannel(msg, client);
            if (channel == null) {
                msg.channel.send(`Bind me to a channel first (${args[1]})`);
                return;
            }
            break;

        case "user":
            id = msg.mentions.users.first().id;
            pingString = `<@${id}>`;
            channel = msg.channel;
            break;

        case "self":
            id = args[2];
            pingString = `<@${id}>`;
            channel = msg.channel;
            break;
    }
    channel.send(`${pingString} ${msgBody}`);
}

function respondWord(msg, word, response) {
    if (msg.content.toLowerCase() == word) {
        msg.channel.send(response).catch(console.error);
    }
}

function reactWord(msg, word, reactions) {
    if (msg.content.toLowerCase() == word) {
        for (var j = 0; j < reactions.length; j++) {
            msg.react(reactions[j]).catch(console.error);
        }
    }
}

function respondContainsWord(msg, word, response) {
    var splitmsg = msg.content.split(" ");
    for (var i = 0; i < splitmsg.length; i++) {
        if (splitmsg[i].toLowerCase() == word) {
            msg.channel.send(response).catch(console.error);
            break;
        }
    }
}

function reactContainsWord(msg, word, reactions) {
    var splitmsg = msg.content.split(" ");
    for (var i = 0; i < splitmsg.length; i++) {
        if (splitmsg[i].toLowerCase() == word) {
            for (var j = 0; j < reactions.length; j++) {
                msg.react(reactions[j]).catch(console.error);
            }
            break;
        }
    }
}

exports.reactContainsWord = reactContainsWord;
exports.respondContainsWord = respondContainsWord;
exports.reactWord = reactWord;
exports.respondWord = respondWord;
exports.announce = announce;
exports.water = water;
