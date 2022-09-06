const discord = require("discord.js");
const { PromiseDatabase } = require("./promisedb");

const quartzrpg = new PromiseDatabase({
    host: "localhost",
    user: "local",
    password: "1234",
    database: "quartzrpg",
});

async function getPlayer(playerId) {
    return await quartzrpg
        .query(`SELECT COUNT(1) FROM player WHERE playerId = ${playerId}`)
        .then(async (count) => {
            if (count[0]["COUNT(1)"] == 0) {
                await quartzrpg.query(
                    `INSERT INTO player(playerId) VALUES(${playerId})`
                );
            }
        })
        .then(async () => {
            return (
                await quartzrpg.query(
                    `SELECT * FROM player WHERE playerId = ${playerId}`
                )
            )[0];
        });
}

exports.getPlayer = getPlayer;
