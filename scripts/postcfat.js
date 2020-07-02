const rp = require("request-promise-native");
const discord = require("discord.js");
const utility = require("./utility.js");
const commands = require("./commands.js");

function postContests(msg, args, client, boundTo) {
    //TODO:
    //args with objects
    //error catching?
    //keep track of alerts in db
    //put TODO: on trello
    //extremely low prio: condense code MORE
    //MAL API integration
    //League/Valorant API integration
    //put bot on heroku

    var contestEmbed = new discord.MessageEmbed()
        .setTitle("Upcoming Contests")
        .setDescription("Codeforces and Atcoder")
        .setColor("#0099ff");

    msg.channel
        .send("`Crafting contest data...`")
        .then((newMsg) => {
            msg.channel
                .send(contestEmbed)
                .then(async (embedMsg) => {
                    const options = {
                        json: true,
                    };
                    const cf = await rp(
                        "https://codeforces.com/api/contest.list?gym=false",
                        options
                    );
                    const at = await rp(
                        "https://atcoder-api.appspot.com/contests",
                        options
                    );
                    var cfp = new Promise((resolve) => {
                        var contestData = getUpcoming(cf.result, "name");
                        embedContestData(contestData, contestEmbed);
                        resolve(null);
                    });
                    var atp = new Promise((resolve) => {
                        var contestData = getUpcoming(at.reverse(), "id");
                        embedContestData(contestData, contestEmbed);
                        resolve(null);
                    });
                    Promise.all([cfp, atp]).then(() => {
                        embedMsg.edit(contestEmbed);
                        newMsg.delete();
                    });
                })
                .catch(console.log);
        })
        .catch((e) => {
            if (e) throw e;
        });
}

async function checkSoon(msg, args, client) {
    const options = { json: true };
    const cf = await rp(
        "https://codeforces.com/api/contest.list?gym=false",
        options
    );
    const at = await rp("https://atcoder-api.appspot.com/contests", options);
    var contestData = getUpcoming(cf.result, "name");
    contestAlert(contestData, client);
    var contestData = getUpcoming(at.reverse(), "id");
    contestAlert(contestData, client);
}

function contestAlert(contestData, client) {
    for (var i = 0; i < contestData.length; i++) {
        var time = contestData[i].secondsToStart;
        const announceParams = [
            "announce",
            "contest",
            "",
            `${name} in ${Math.floor(time / 60)}m`,
        ];
        if (Math.floor(time / 60) <= 60) {
            var name = contestData[i].name;
            commands.announce(null, announceParams, client);
        }
    }
}

function getUpcoming(data, namePropertyName) {
    //contest data from most recent to latest
    contests = [];
    for (var i = 0; i < data.length; i++) {
        var contest = data[i];
        var time = Math.floor(
            contest.startTimeSeconds - new Date().getTime() / 1000
        );
        if (time <= 0) break;
        contests.push({
            name: contest[namePropertyName],
            secondsToStart: time,
        });
    }
    return contests;
}

function embedContestData(contests, embed) {
    //contest data from most recent to latest
    for (var i = 0; i < contests.length; i++) {
        var { name, secondsToStart } = contests[i];
        var { d, h, m } = utility.convertToDHM(secondsToStart);
        embed.addField(`${name}`, `Starts In: ${d}d ${h}h ${m}m`);
    }
}

exports.postContests = postContests;
exports.checkSoon = checkSoon;
