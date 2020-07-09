const discord = require("discord.js");
const config = require("./config.json");
const commands = require("./scripts/commands.js");
const { commandfuncs } = commands;
const promisedb = require("./scripts/promisedb.js");
const { quartzconfig, getGuildProperty } = promisedb;

const client = new discord.Client();

function checkServerConfig(guildId) {
    quartzconfig
        .query(`SELECT COUNT(1) FROM config WHERE guildId = ${guildId}`)
        .then((count) => {
            if (count[0]["COUNT(1)"] == 0) {
                quartzconfig.query(
                    `INSERT INTO config(guildId) VALUES(${guildId})`
                );
            }
        });
}

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);

    const guildIds = client.guilds.cache.keys();
    for (const id of guildIds) {
        checkServerConfig(id);
    }
    //commands.clock();
});
client.on("guildCreate", (guild) => checkServerConfig(guild.id));

client.on("message", async (msg) => {
    if (msg.content == "thanks quartz") {
        msg.react("👍").catch(console.error);
    }

    const prefix = await getGuildProperty(msg, "prefix");
    if (msg.content.substring(0, prefix.length) != prefix) {
        return;
    }

    var args = msg.content.substring(prefix.length).split(" ");
    if (commandfuncs.hasOwnProperty(args[0])) {
        commandfuncs[args[0]](msg, args, client);
    }
});

client.login(config.token);
