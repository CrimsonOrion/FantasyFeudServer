/*
 * Host pages: season/game picker backed by FantasyFeudApiServer content.
 */

var content = require('../lib/contentClient');

exports.index = async function (req, res, next) {
    try {
        var seasons = await content.seasons();
        res.render('index', { seasons: seasons });
    } catch (error) {
        next(error);
    }
};

exports.season = async function (req, res, next) {
    try {
        var games = await content.season(req.params.id);
        res.render('season', { seasonId: req.params.id, games: games });
    } catch (error) {
        next(error);
    }
};

exports.game = async function (req, res, next) {
    try {
        var game = await content.game(req.params.id);
        res.render('game', { game: game });
    } catch (error) {
        next(error);
    }
};
