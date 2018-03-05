import * as WS from 'ws';

export enum RoomType {
    open,
    connected,
    reconnect
}

export interface Room {
    type: RoomType,
    game: string
}

export interface OpenRoom extends Room {
    master: string,
    masterWS: WS,
    passcode?: string, // only if it is private
}

export interface ConnectedRoom extends Room {
    id: string,
    master: string,
    masterWS: WS,
    mirror: string,
    mirrorWS: WS
}

export interface ReconnectRoom extends Room {
    id: string,
    waiter: string,
    waiterWS: WS,
    asmaster: boolean,
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

export interface RoomSignal {
    id: string,
    signal: any
}