// Require needed modules and initialize Express app
const express = require('express');

// Body Parser for JSON parsing
const bodyParser = require('body-parser');

// CORS for Cross-Origin Resource Sharing
const cors = require('cors');

const app = express();

// Middleware for GET /events endpoint
function eventsHandler(req, res, next) {
    // Mandatory headers and http status to keep connection open
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    res.writeHead(200, headers);
    
    // After client opens connection send all nests as string
    const data = `data: ${JSON.stringify(questions)}\n\n`;
    res.write(data);
    res.flushHeaders();
    // Generate an id based on timestamp and save res
    // object of client connection on clients list
    // Later we'll iterate it and send updates to each client
    const clientId = Date.now();
    const newClient = {
        id: clientId,
        res
    };
    clients.push(newClient);

    // When client closes connection we update the clients list
    // avoiding the disconnected one
    req.on('close', () => {
        console.log(`${clientId} Connection closed`);
        clients = clients.filter(c => c.id !== clientId);
    });
}

// Iterate clients list and use write res object method to send visible
function sendEventsToAll(json) {
    clients.forEach(c => c.res.write(`data: ${JSON.stringify(json)}\n\n`))
}

// Middleware for POST /question endpoint
async function addQuestion(req, res, next) {
    const newQuestion = req.body;
    questions.push(newQuestion);

    // Send recently added question as POST result
    res.json(newQuestion)

    // Invoke iterate and send function
    return sendEventsToAll(newQuestion);
}

// Set cors and bodyParser middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Define endpoints
app.post('/question', addQuestion);
app.get('/events', eventsHandler);
app.get('/status', (req, res) => res.json({ clients: clients.length }));

const PORT = process.env.PORT || 3001;

let clients = [];
let questions = [];

// Start server on 3001 port
app.listen(PORT, function () { console.log(`Question service listening on port ${PORT}`); });