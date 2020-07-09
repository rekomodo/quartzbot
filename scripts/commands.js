const discord = require("discord.js");
const config = require("../config.json");
const cfat = require("./postcfat.js");
const { exit } = require("process");
const promisedb = require("./promisedb.js");
const { quartzconfig, getGuildProperty } = promisedb;
const rpgCmd = require("./rpg.js");

exports.commandfuncs = {
    say: (msg, args) => {
        msg.channel.send(args.slice(1).join(" "));
    },
    contests: (msg, args, client) => {
        switch (args[1]) {
            case "soon":
                cfat.checkSoon(msg, args, client);
                break;
            default:
                cfat.postContests(msg, args);
                break;
        }
    },
    bind: async (msg, args, client) => {
        if (args[1] == "contestRole") {
            quartzconfig.query(
                `UPDATE config 
                SET contestRole = ${msg.mentions.roles.first().id} 
                WHERE guildId = ${msg.guild.id}`
            );
            msg.channel.send(
                `contestRole changed to ${msg.mentions.roles.first().name}`
            );
        } else {
            boundChannel = await getBoundChannel(msg, client);
            if (boundChannel == msg.channel) {
                await quartzconfig.query(
                    `UPDATE config 
                    SET boundTo = NULL 
                    WHERE guildId = ${msg.guild.id}`
                );
                msg.channel.send(`Unbound from ${msg.channel}`);
            } else {
                await quartzconfig.query(
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
            msg.channel
                .send("**why master? why must I suffer so...**")
                .then(() => {
                    client.destroy();
                    quartzconfig.close();
                    quartzeconomy.close();
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
};

async function checkPlayerAccount(msg) {
    await quartzeconomy
        .query(
            `SELECT COUNT(1) FROM playerresources WHERE playerId = ${msg.author.id}`
        )
        .then((count) => {
            if (count[0]["COUNT(1)"] == 0) {
                quartzeconomy.query(
                    `INSERT INTO playerresources(playerId) VALUES(${msg.author.id})`
                );
            }
        });
}

async function getBoundChannel(msg, client) {
    const boundId = await getGuildProperty(msg, "boundTo");
    var boundChannel;
    if (boundId == null) boundChannel = null;
    else boundChannel = await client.channels.fetch(boundId);
    return boundChannel;
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

exports.announce = announce;
