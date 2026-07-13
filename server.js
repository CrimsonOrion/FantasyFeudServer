require('dotenv').config({ quiet: true });

// Require needed modules and initialize Express app
const express = require('express');
const http = require('http');
const path = require('path');

// CORS for Cross-Origin Resource Sharing
const cors = require('cors');

const routes = require('./routes');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: { origin: '*' }
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));

// Set cors and bodyParser middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Latest board state, kept so a board that connects/reconnects mid-game
// can catch up immediately instead of waiting for the next question.
let currentState = null;

// Middleware for POST /question endpoint
async function addQuestion(req, res, next) {
    const newQuestion = req.body;

    try {
        if (newQuestion.IsValid === true) {
            delete newQuestion.IsValid;

            currentState = newQuestion;

            // Send recently added question as POST result
            res.json(newQuestion);

            // Broadcast the new state to every connected board
            io.emit('board:update', currentState);
            return;
        } else {
            // Throw an error if it isn't valid
            throw ErrorEvent();
        }
    } catch (error) {
        // Return an empty 200 message
        res.json(error);
        return error;
    }
}

// Define endpoints
app.post('/question', addQuestion);
app.get('/status', (req, res) => res.json({ clients: io.engine.clientsCount }));
app.get('/current-state', (req, res) => res.json(currentState));

// Host pages: season/game picker backed by FantasyFeudApiServer content
app.get('/', routes.index);
app.get('/seasons/:id', routes.season);
app.get('/games/:id', routes.game);

io.on('connection', (socket) => {
    console.log(`${socket.id} connected`);

    // A board asking to catch up on the current state (initial load or reconnect)
    socket.on('board:init', () => {
        socket.emit('board:update', currentState);
    });

    socket.on('disconnect', () => {
        console.log(`${socket.id} disconnected`);
    });
});

const PORT = process.env.PORT || 3000;

// Start server on above PORT
server.listen(PORT, function () { console.log('Fantasy Feud Admin server listening on port:', PORT); });
