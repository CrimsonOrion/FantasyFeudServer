# Fantasy Feud Server

The live game hub. It broadcasts board state to connected displays over
Socket.IO, and serves a pug-rendered host UI for running a game pulled from
[FantasyFeudApiServer](../FantasyFeudApiServer)'s content.

## How it fits together

```
FantasyFeudApiServer  --(game content)-->  FantasyFeudServer  --(Socket.IO)-->  FantasyFeudSite
   (question data)         host UI reads it     (this app)         board display
```

- [FantasyFeudApiServer](../FantasyFeudApiServer) holds the static question/answer content.
- **FantasyFeudServer** (this app) holds the *live* game state (team names,
  scores, members, strikes, which answers are revealed) and pushes it to
  every connected board over a socket. It also serves a host UI for driving
  that state without hand-crafting requests.
- [FantasyFeudSite](../FantasyFeudSite) is the on-air board display — a static page
  with no server of its own — that connects to this server's socket.

State gets into the game one of two ways: an external tool `POST`s a full
board-state blob to `/question`, or you use the host UI at `/`, which does
the same `POST` on your behalf.

## Running it

```bash
npm install
cp .env.example .env   # adjust PORT / RESOURCE_SERVER if needed
npm start
```

Listens on port `3000` by default. `RESOURCE_SERVER` (default
`localhost:3001`) tells it where to find `FantasyFeudApiServer` for the host
UI's season/game listings.

## Using the host UI

Open `http://localhost:3000/` in a browser:

1. Pick a season, then a game.
2. Set team names and paste in each team's members (comma separated) — click
   a member's name to mark them as the active player at the podium.
3. Click **Start This Question** on a question to push it live (all answers
   hidden, strikes cleared).
4. Click **Reveal** on an answer as it's guessed correctly.
5. Use **Add Strike** for a wrong answer, **Award Pot to Team N** to give a
   team the value of everything currently revealed, and the score fields
   (directly editable, or ±5) to make manual adjustments. **Score Reset**
   zeroes one team's score.
6. **Reset Board** clears the current question/strikes/answers but keeps
   team names, members, and scores. **Reset Game** clears all of that too —
   use it to start a fresh game.

The host page reloads showing whatever is currently live (via
`GET /current-state`), so refreshing or reconnecting mid-game doesn't lose
anything.

## Endpoints

| Method | Path              | Purpose                                                        |
|--------|-------------------|------------------------------------------------------------------|
| POST   | `/question`       | Push a full board-state JSON blob live (requires `IsValid: true`) |
| GET    | `/current-state`  | The last state pushed via `/question`                          |
| GET    | `/status`         | `{ "clients": <connected socket count> }`                      |
| GET    | `/`               | Host UI: season list                                            |
| GET    | `/seasons/:id`    | Host UI: games in a season                                      |
| GET    | `/games/:id`      | Host UI: run a game (`:id` is `<season-id>---<game-id>`)       |

## Socket events

| Event          | Direction        | Purpose                                          |
|----------------|------------------|---------------------------------------------------|
| `board:init`   | client → server  | Ask for the current state (on connect/reconnect) |
| `board:update` | server → client  | The current board state                          |
