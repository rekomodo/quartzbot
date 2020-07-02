function convertToDHM(time) {
    var days = Math.floor(time / (3600 * 24));
    time -= days * 3600 * 24;
    var hours = Math.floor(time / 3600);
    time -= hours * 3600;
    var minutes = Math.floor(time / 60);
    return {
        d: days,
        h: hours,
        m: minutes
    };
}

exports.convertToDHM = convertToDHM;