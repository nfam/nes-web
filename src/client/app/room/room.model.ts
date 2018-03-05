export enum RoomStatus {
    serverConnect = 1,      // Connect to Server
    serverFailed,           // Failed to connect to Server
    serverConnected,        // Connected to Management Server
    serverWaiting,          // Waiting for a peer assgined from Server
    serverDisconnected,     // Connection to server was dropped, try to reconnect
    peerConnect,            // Connect to Peer as Mirror
    peerWaiting,            // Master waiting for Peer to connect to us
    peerConnected,          // Connected to Peer
    peerDisconnected,       // Connection to Peer has dropped.
    peerReconnect,          // Wiating for the other peer after peer connection has dropped.

    // Following considered as uninitiated aka. null
    passcodeInvalid,        //  No game with provided passcode found.
    roomIdInvalid,          // Should abandon the game.
    abandoned               // The other player abaondon the game.
}

export interface Room {
    game: string,
    asmaster: boolean,      // Indicates if you are hosting the game.
    this: string,           // Your username.
    that?: string,          // The other player username.
    passcode?: string,      // Only if you are hosting a private game.
    id?: string             // Only once both player agreed to join the room.
}

export type RoomRequestType = 
    'anyone' |              // Create a public or Join any available public room.
    'create' |              // Create a private room.
    'join' |                // Join a private room with passcode.
    'masterReconnect' |     // Reconnect as a master with room id.
    'mirrorReconnect' |     // Reconnect as a mirror with room id.
    'abandon'               // Abandome a game.

export interface RoomRequest {
    type: RoomRequestType,
    game: string,
    username: string,
    id?: string,      // for rejoin
    passcode?: string // only for join
}

export type RoomResponseStatus = 
    'created' |             // A game was created on server, waiting for someone to join.
    'masterJoined' |        // A mirror found your game, waiting for him or her to connect to your computer.
    'mirrorJoined' |        // Found an existing game, do connect to the master computer.
    'reconnect' |           // Reconnected to the server, waiting for the other to reconnect.
    'roomIdInvalid'|        // Room Id was used by other pair, should abandon the game.
    'passcodeInvalid' |     // No game with the passcode
    'abandoned'             // The other player abaond the game.

export interface RoomResponse {
    status: RoomResponseStatus
    game: string,
    this: string,           // Your Nick name
    that?: string,          // The other player name.
    passcode?: string,      // Passcode available if it is privately created.
    id?: string
}
