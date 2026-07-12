/*
 * Fetch game content from the FantasyFeudApiServer content server.
 */

var RESOURCE_SERVER = process.env.RESOURCE_SERVER || 'localhost:3001';

async function getJson(path) {
    var response = await fetch('http://' + RESOURCE_SERVER + path);
    return response.json();
}

module.exports = {
    seasons: function () {
        return getJson('/game-content/seasons');
    },
    season: function (id) {
        return getJson('/game-content/seasons/' + id);
    },
    game: function (id) {
        return getJson('/game-content/games/' + id);
    }
};
