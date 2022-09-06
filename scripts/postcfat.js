const rp = require("request-promise-native");
const discord = require("discord.js");
const utility = require("./utility.js");
const commands = require("./commands.js");

function postContests(msg, args) {
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
        .setDescription("Codeforces, Atcoder, Codechef")
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
                    //change cf and at to use .then()
                    const cf = await rp(
                        "https://www.kontests.net/api/v1/codeforces",
                        options
                    );
                    const at = await rp(
                        "https://www.kontests.net/api/v1/at_coder",
                        options
                    );
                    const chef = await rp(
                        "https://www.kontests.net/api/v1/code_chef",
                        options
                    );
                    var cfp = new Promise((resolve) => {
                        var contestData = getUpcoming(cf);
                        embedContestData(contestData, contestEmbed);
                        resolve(null);
                    });
                    var atp = new Promise((resolve) => {
                        var contestData = getUpcoming(at);
                        embedContestData(contestData, contestEmbed);
                        resolve(null);
                    });
                    var chefp = new Promise((resolve) => {
                        var contestData = getUpcoming(chef);
                        embedContestData(contestData, contestEmbed);
                        resolve(null);
                    });
                    Promise.all([cfp, atp, chefp]).then(() => {
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

function getUpcoming(data) {
    //contest data from most recent to latest
    contests = [];
    for (var i = 0; i < data.length; i++) {
        var contest = data[i];
        var time = Math.floor(
            (Date.parse(contest.start_time) - new Date().getTime()) / 1000
        );
        if (time < 0) continue;
        contests.push({
            name: contest.name,
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
