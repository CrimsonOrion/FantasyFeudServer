const request = require('supertest');
const { io: Client } = require('socket.io-client');
const { server } = require('../server');

let baseUrl;

function onceEvent(socket, event) {
    return new Promise((resolve) => socket.once(event, resolve));
}

beforeAll((done) => {
    server.listen(0, () => {
        baseUrl = 'http://localhost:' + server.address().port;
        done();
    });
});

afterAll((done) => {
    server.close(done);
});

describe('Socket.IO board broadcast', () => {
    test('board:init replies with the current state (null before any question is posted)', async () => {
        const client = Client(baseUrl);
        await onceEvent(client, 'connect');

        client.emit('board:init');
        const data = await onceEvent(client, 'board:update');

        expect(data).toBeNull();
        client.close();
    });

    test('POST /question broadcasts board:update to every connected client', async () => {
        const client = Client(baseUrl);
        await onceEvent(client, 'connect');

        const updatePromise = onceEvent(client, 'board:update');

        await request(baseUrl).post('/question').send({
            IsValid: true,
            Question: 'Live update test',
            Answers: []
        });

        const data = await updatePromise;

        expect(data.Question).toBe('Live update test');
        client.close();
    });
});
