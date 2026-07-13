jest.mock('../lib/contentClient');

const request = require('supertest');
const content = require('../lib/contentClient');
const { app } = require('../server');

describe('GET /status', () => {
    test('reports zero connected clients when nothing is connected', async () => {
        const response = await request(app).get('/status');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ clients: 0 });
    });
});

describe('GET /current-state', () => {
    test('is null before any question has been posted', async () => {
        const response = await request(app).get('/current-state');

        expect(response.status).toBe(200);
        expect(response.body).toBeNull();
    });
});

describe('POST /question', () => {
    test('stores and echoes back a valid question, reflected in /current-state', async () => {
        const question = {
            IsValid: true,
            Question: 'Name something you find at the beach',
            Team1Name: 'Team 1',
            Team2Name: 'Team 2',
            Team1Score: 0,
            Team2Score: 0,
            Team1Members: [],
            Team2Members: [],
            Strikes: 0,
            Responses: 1,
            Answers: [{ Answer: 'Sand', Value: 40, Visible: 0 }]
        };

        const postResponse = await request(app).post('/question').send(question);

        expect(postResponse.status).toBe(200);
        expect(postResponse.body).not.toHaveProperty('IsValid');
        expect(postResponse.body.Question).toBe(question.Question);

        const stateResponse = await request(app).get('/current-state');
        expect(stateResponse.body.Question).toBe(question.Question);
    });

    test('does not store a question missing IsValid: true', async () => {
        await request(app).post('/question').send({
            IsValid: true,
            Question: 'seed state',
            Answers: []
        });

        const rejectedResponse = await request(app)
            .post('/question')
            .send({ Question: 'should not be stored' });

        expect(rejectedResponse.status).toBe(200);

        const stateResponse = await request(app).get('/current-state');
        expect(stateResponse.body.Question).toBe('seed state');
    });
});

describe('host pages', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('GET / renders the season list', async () => {
        content.seasons.mockResolvedValue([{ id: 'test-season', name: 'Test Season' }]);

        const response = await request(app).get('/');

        expect(response.status).toBe(200);
        expect(response.text).toContain('Test Season');
    });

    test('GET /seasons/:id renders the games in that season', async () => {
        content.season.mockResolvedValue([
            { id: 'test-season---test-game-1', name: 'Test Game #1' }
        ]);

        const response = await request(app).get('/seasons/test-season');

        expect(content.season).toHaveBeenCalledWith('test-season');
        expect(response.status).toBe(200);
        expect(response.text).toContain('Test Game #1');
    });

    test('GET /games/:id renders the game with its questions', async () => {
        content.game.mockResolvedValue({
            id: 'test-season---test-game-1',
            game_title: 'Test Game #1',
            description: 'Sample game',
            questions: [
                { id: 'q1', question: 'Name something you find at the beach', answers: [{ answer: 'Sand', value: 40 }] }
            ]
        });

        const response = await request(app).get('/games/test-season---test-game-1');

        expect(content.game).toHaveBeenCalledWith('test-season---test-game-1');
        expect(response.status).toBe(200);
        expect(response.text).toContain('Name something you find at the beach');
    });
});
