const discord = require("discord.js");
const config = require("./config.json");
const commands = require("./scripts/commands.js");
const { commandfuncs } = commands;
const promisedb = require("./scripts/promisedb.js");
const { quartzconfig, getGuildProperty } = promisedb;

const client = new discord.Client();

var silenceArthur = false;

function checkServerConfig(guildId) {
    quartzconfig
        .get(`SELECT COUNT(1) FROM config WHERE guildId = ${guildId}`)
        .then((count) => {
            if (count[0]["COUNT(1)"] == 0) {
                quartzconfig.run(
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
        return;
    }

    //if author is arthur
    if (msg.author.id == "316411193017368577" && silenceArthur) {
        msg.delete();
        return;
    }

    commands.respondWord(msg, "mamamela", "*se la mama*");
    commands.respondWord(
        msg,
        "apex?",
        "https://media.discordapp.net/attachments/777723763038617601/806284824025104384/unknown.gif"
    );
    commands.reactWord(msg, "ok", ["🥶"]);
    commands.reactWord(msg, "ya", ["🥶"]);
    commands.reactWord(msg, "thanks quartz", ["👍"]);
    commands.respondContainsWord(msg, "kebin", "bin");

    if (msg.author.id == "364220458666688514") {
        commands.reactContainsWord(msg, "apex", ["🧢", "👻"]);
    }

    const prefix = await getGuildProperty(msg, "prefix");
    if (msg.content.substring(0, prefix.length) != prefix) {
        return;
    }

    if (msg.content == prefix + "silence") {
        silenceArthur = !silenceArthur;
        msg.react("👍").catch(console.error);
        return;
    }

    var args = msg.content.substring(prefix.length).split(" ");
    if (commandfuncs.hasOwnProperty(args[0])) {
        commandfuncs[args[0]](msg, args, client);
    }
});

client.login(config.token);
