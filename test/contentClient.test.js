function mockFetchResolving(body) {
    global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve(body)
    });
}

describe('lib/contentClient', () => {
    const originalResourceServer = process.env.RESOURCE_SERVER;

    afterEach(() => {
        jest.resetModules();
        process.env.RESOURCE_SERVER = originalResourceServer;
    });

    test('seasons fetches from RESOURCE_SERVER', async () => {
        process.env.RESOURCE_SERVER = 'http://localhost:3001';
        mockFetchResolving([{ id: 'test-season' }]);
        const content = require('../lib/contentClient');

        const result = await content.seasons();

        expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/game-content/seasons');
        expect(result).toEqual([{ id: 'test-season' }]);
    });

    test('season fetches the given season id from RESOURCE_SERVER', async () => {
        process.env.RESOURCE_SERVER = 'http://localhost:3001';
        mockFetchResolving([]);
        const content = require('../lib/contentClient');

        await content.season('test-season');

        expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/game-content/seasons/test-season');
    });

    test('game fetches the given game id from RESOURCE_SERVER', async () => {
        process.env.RESOURCE_SERVER = 'http://localhost:3001';
        mockFetchResolving({});
        const content = require('../lib/contentClient');

        await content.game('test-season---test-game-1');

        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3001/game-content/games/test-season---test-game-1'
        );
    });

    test('falls back to http://localhost:3001 when RESOURCE_SERVER is unset', async () => {
        delete process.env.RESOURCE_SERVER;
        mockFetchResolving([]);
        const content = require('../lib/contentClient');

        await content.seasons();

        expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/game-content/seasons');
    });
});
