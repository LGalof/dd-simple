# 07 API and Realtime

## HTTP API

### Public and Authentication Routes

| Method | Route | Auth | Purpose | Rule |
|---|---|---|---|---|
| GET | `/health` | Public | Health check. | Returns service health information. |
| POST | `/auth/register` | Public | Register a local account. | Email and password are required. |
| POST | `/auth/login` | Public | Log in and receive a bearer token. | Credentials must match a stored user. |
| GET | `/auth/me` | Required | Load the current user. | Requires a valid bearer token. |

### Reference Routes

Reference routes are public read endpoints.

| Method | Route | Purpose |
|---|---|---|
| GET | `/references/ability-scores` | Load ability score references. |
| GET | `/references/alignments` | Load alignment references. |
| GET | `/references/skills` | Load skill references. |
| GET | `/references/species` | Load species references. |
| GET | `/references/classes` | Load class references. |
| GET | `/references/backgrounds` | Load background references. |
| GET | `/references/conditions` | Load condition references. |
| GET | `/references/proficiencies` | Load proficiency references. |
| GET | `/references/equipment` | Load equipment references. |
| GET | `/references/rules/:category` | Load rule documents by category. |
| GET | `/references/rules/:category/:index` | Load one rule document by category and index. |

### Character Routes

Character routes require authentication and operate on characters owned by the authenticated user.

| Method | Route | Purpose | Rule |
|---|---|---|---|
| POST | `/characters` | Create a character. | Character is created for the authenticated user. |
| GET | `/characters` | List characters. | Returns the authenticated user's characters. |
| GET | `/characters/:id` | Load one character. | Character must belong to the authenticated user. |
| PATCH | `/characters/:id` | Update character state. | Character must belong to the authenticated user. |
| DELETE | `/characters/:id` | Delete a character. | Character must belong to the authenticated user. |
| GET | `/characters/:id/actions` | Load derived actions. | Character must belong to the authenticated user. |
| GET | `/characters/:id/derived` | Load derived dashboard state. | Character must belong to the authenticated user. |
| POST | `/characters/:id/derived` | Preview derived state with request overrides. | Character must belong to the authenticated user. |
| GET | `/characters/:id/defenses` | Load derived defenses. | Character must belong to the authenticated user. |
| POST | `/characters/:id/conditions` | Add or update a character condition. | Character must belong to the authenticated user. |
| DELETE | `/characters/:id/conditions/:conditionIndex` | Remove a condition. | Character must belong to the authenticated user. |
| POST | `/characters/:id/dice-rolls` | Save a dice roll. | Character must belong to the authenticated user. |
| GET | `/characters/:id/inventory` | Load normalized inventory rows. | Character must belong to the authenticated user. |
| PUT | `/characters/:id/inventory` | Replace normalized inventory rows. | Character must belong to the authenticated user. |
| GET | `/characters/:id/inventory/state` | Load serialized inventory workspace state. | Character must belong to the authenticated user. |
| PUT | `/characters/:id/inventory/state` | Save serialized inventory workspace state. | Character must belong to the authenticated user. |

### Room Routes

Room routes require authentication.

| Method | Route | Purpose | Rule |
|---|---|---|---|
| POST | `/rooms` | Create a room. | Requires a `characterId` owned by the authenticated user. |
| GET | `/rooms` | List rooms the authenticated user created or joined. | Requires authentication. |
| POST | `/rooms/:roomCode/join` | Join a room by code. | Requires an existing room and a character owned by the authenticated user. |
| GET | `/rooms/:roomCode` | Load room players and board state. | Requires authentication and a valid room code. |

## Socket.IO Events

Socket connections authenticate with a bearer token provided in socket auth data or query parameters.

### Client Events

| Event | Purpose | Rule |
|---|---|---|
| `room:join` | Join a socket room for a room code and character. | Token must be valid; character must belong to the user. |
| `room:leave` | Leave the current socket room. | Socket must already be connected. |
| `board:state` | Send updated board state for the joined room. | Socket must have joined a room. |
| `board:advance-turn` | Advance the initiative turn for the joined room. | DM may move backward or forward; active player may advance forward. |

### Server Events

| Event | Purpose |
|---|---|
| `room:update` | Sends room data, players, and board state after room changes. |
| `board:update` | Sends updated board state to connected clients in the room, including the sender after successful updates. |

## Synchronization Flow

1. The frontend loads room data through REST.
2. The Socket.IO client connects with the bearer token.
3. The client emits `room:join` with room code and character ID.
4. The server validates the user and character, joins the socket room, and emits `room:update`.
5. Board edits send `board:state`.
6. The server saves the board state and emits `board:update` to connected clients in the room, including the sender.
7. The sender also receives the acknowledgement callback for the board update.

Controllers return JSON error messages with HTTP status codes for validation and ownership failures. Socket events use callback error objects for join and board-update failures.
