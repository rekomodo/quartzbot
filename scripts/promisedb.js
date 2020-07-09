const mysql = require("mysql");
class PromiseDatabase {
    constructor(config) {
        this.connection = mysql.createConnection(config);
    }
    query(sql, args) {
        return new Promise((resolve, reject) => {
            this.connection.query(sql, args, (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }
    close() {
        return new Promise((resolve, reject) => {
            this.connection.end((err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }
}

const quartzconfig = new PromiseDatabase({
    host: "localhost",
    user: "local",
    password: "1234",
    database: "quartzconfig",
});

async function getGuildProperty(msg, property) {
    const id = msg.guild.id;
    const rowPacket = await quartzconfig.query(
        `SELECT ${property} FROM config WHERE guildId = ${id}`
    );
    return rowPacket[0][property];
}

exports.PromiseDatabase = PromiseDatabase;
exports.quartzconfig = quartzconfig;
exports.getGuildProperty = getGuildProperty;
