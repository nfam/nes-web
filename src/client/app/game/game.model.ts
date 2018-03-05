export interface Game {
    name: string,
    multiplayer?: boolean
}

export enum PlayingMode {
    singleplayer = 1,
    multiplayer = 2
}

export enum RoomOption {
    username,
    anyone,
    create,
    join
}