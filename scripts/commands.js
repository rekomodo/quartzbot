const fs = require("fs");
const discord = require("discord.js");
const config = require("../config.json");
const cfat = require("./postcfat.js");
const { exit, disconnect } = require("process");
const promisedb = require("./promisedb.js");
const { quartzconfig, quartzeconomy, getGuildProperty } = promisedb;

var resources = ["kelp", "quartz", "prismarine", "enderine", "stardust"];

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
                cfat.postContests(msg, args, client);
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
    econ: async (msg, args, client) => {
        await checkPlayerAccount(msg);
        var playerEconData = (
            await quartzeconomy.query(
                `SELECT * FROM playerresources WHERE playerId = ${msg.author.id}`
            )
        )[0];
        const econEmbed = new discord.MessageEmbed()
            .setColor("#0099ff")
            .setTitle(
                `${
                    msg.guild.members.resolve(playerEconData.playerId).nickname
                }'s econ`
            )
            .addFields([
                {
                    name: "Gold Nuggets",
                    value: playerEconData.goldNuggets,
                },
                {
                    name: "Max Of Each Resource",
                    value: playerEconData.maxResource,
                },
            ])
            .setTimestamp();

        //usa la tabla de resources pa llena eto (ponle indentifier "droga")
        for (var [key, value] of Object.entries(playerEconData)) {
            if (resources.indexOf(key) > -1)
                econEmbed.addField(key, value, true);
        }
        msg.channel.send(econEmbed);
    },
    stonks: async (msg, args, client) => {
        var resourceData = await quartzeconomy.query("SELECT * FROM resources");
        const resourceEmbed = new discord.MessageEmbed()
            .setColor("#0099ff")
            .setTitle("Quartz Stonks")
            .setTimestamp();
        for (var i = 0; i < resourceData.length; i++) {
            const resource = resourceData[i];
            const { resourceName, resourceValue } = resource;
            resourceEmbed.addField(
                `${resourceName}`,
                `Value: ${resourceValue}`,
                true
            );
        }
        msg.channel.send(resourceEmbed);
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

async function clock() {
    for (var i = 0; i < resources.length; i++) {
        var increase = Math.random() < 0.5;
        multiplier = increase ? 1 : -1;
        var resourceValue = (
            await quartzeconomy.query(
                `SELECT * FROM resources WHERE resourceName = ${resources[i]}`
            )
        )[0].resourceValue;
        quartzeconomy.query(
            `UPDATE resources SET resourceValue = ${parseInt(
                resourceValue * 0.05 * multiplier
            )} WHERE resourceName = ${resources[i]}`
        );
    }
    setTimeout(clock, 0.1 * 60 * 1000);
    //x minutes = x * 60 * 1000
}

exports.clock = clock;
exports.announce = announce;
