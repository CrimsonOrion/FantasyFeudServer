jest.mock('../lib/contentClient');

const content = require('../lib/contentClient');
const routes = require('../routes/index');

function mockRes() {
    return { render: jest.fn() };
}

describe('routes/index', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('index renders the season list', async () => {
        const seasons = [{ id: 'test-season' }];
        content.seasons.mockResolvedValue(seasons);
        const res = mockRes();

        await routes.index({}, res, jest.fn());

        expect(res.render).toHaveBeenCalledWith('index', { seasons });
    });

    test('index passes content errors to next', async () => {
        const error = new Error('upstream unreachable');
        content.seasons.mockRejectedValue(error);
        const res = mockRes();
        const next = jest.fn();

        await routes.index({}, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(res.render).not.toHaveBeenCalled();
    });

    test('season renders the games in that season', async () => {
        const games = [{ id: 'test-season---test-game-1' }];
        content.season.mockResolvedValue(games);
        const res = mockRes();

        await routes.season({ params: { id: 'test-season' } }, res, jest.fn());

        expect(content.season).toHaveBeenCalledWith('test-season');
        expect(res.render).toHaveBeenCalledWith('season', { seasonId: 'test-season', games });
    });

    test('game renders the requested game', async () => {
        const game = { id: 'test-season---test-game-1', questions: [] };
        content.game.mockResolvedValue(game);
        const res = mockRes();

        await routes.game({ params: { id: 'test-season---test-game-1' } }, res, jest.fn());

        expect(content.game).toHaveBeenCalledWith('test-season---test-game-1');
        expect(res.render).toHaveBeenCalledWith('game', { game });
    });
});
