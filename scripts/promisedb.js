const sqlite = require("better-sqlite3");
class PromiseDatabase {
    constructor(dbname) {
        this.database = new sqlite(dbname);
    }
    get(sql) {
        return new Promise((resolve, reject) => {
            const statement = this.database.prepare(sql);
            resolve(statement.all());
        });
    }
    run(sql) {
        return new Promise((resolve, reject) => {
            const statement = this.database.prepare(sql);
            statement.run();
            resolve();
        });
    }
    close() {
        this.database.close();
    }
}

const quartzconfig = new PromiseDatabase("quartz.db");

async function getGuildProperty(msg, property) {
    const id = msg.guild.id;
    const rowPacket = await quartzconfig.get(
        `SELECT ${property} FROM config WHERE guildId = ${id}`
    );
    return rowPacket[0][property];
}

exports.PromiseDatabase = PromiseDatabase;
exports.quartzconfig = quartzconfig;
exports.getGuildProperty = getGuildProperty;
