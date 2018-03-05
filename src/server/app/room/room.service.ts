import LogService from '../core/log.service';
import * as WS from 'ws';
import * as uuid from 'uuid';

import { OpenRoom, ReconnectRoom, ConnectedRoom, RoomType } from './room.model';

export default class RoomService {

    private openRooms: { [passcode: string]: OpenRoom } = {};
    private reconnectRooms: { [roomId: string]: ReconnectRoom } = {};
    private connectedRooms: { [roomId: string]: ConnectedRoom } = {};

    static $inject = ['logService'];
    constructor(
        private logService: LogService
    ) {
    }

    getConnectedRoom(id: string): ConnectedRoom {
        return this.connectedRooms[id];
    }

    create(game: string, username: string, ws: WS, anyone: boolean): OpenRoom {
        let passcode = this.createPasscode();
        let room: OpenRoom = {
            type: RoomType.open,
            game: game,
            master: username,
            masterWS: ws
        };
        if (!anyone) {
            room.passcode = passcode;
        }
        this.openRooms[passcode] = room;
        return room;
    }

    join(passcode: string, username: string, ws: WS): ConnectedRoom {
        let room = this.openRooms[passcode];
        // TODO ws != WS
        if (room && room.passcode === passcode) {
            delete this.openRooms[passcode];
            return this.startSession(room.game, room.master, room.masterWS, username, ws);
        }
        else {
            return null;
        }
    }

    anyone(game: string, username: string, ws: WS): OpenRoom | ConnectedRoom {
        for (let p in this.openRooms) {
            let room = this.openRooms[p];
            // TODO ws != WS
            if (!room.passcode && room.game == game) {
                delete this.openRooms[p];
                return this.startSession(room.game, room.master, room.masterWS, username, ws);
            }
        }
        return this.create(game, username, ws, true);
    }

    reconnect(id: string, game: string, username: string, ws: WS, asmaster: boolean): ReconnectRoom | ConnectedRoom {
        let room = this.reconnectRooms[id];
        if (room) {
            if (room.asmaster != asmaster) {
                delete this.reconnectRooms[id];
                return this.startSession(
                    game,
                    room.asmaster ? room.waiter : username,
                    room.asmaster ? room.waiterWS : ws,
                    room.asmaster ? username : room.waiter,
                    room.asmaster ? ws : room.waiterWS,
                    id
                );
            }
            else {
                return null;
            }
        }
        else {
            let room: ReconnectRoom = {
                type: RoomType.reconnect,
                game: game,
                id: id,
                waiter: username,
                waiterWS: ws,
                asmaster: asmaster
            };
            this.reconnectRooms[room.id] = room;
            return room;
        }
    }

    abandon(game: string, id: string, ws: WS): ConnectedRoom {
        if (id) {
            let room = this.reconnectRooms[id];
            if (room) {
                if (room.game == game && room.waiterWS === ws) {
                    delete this.reconnectRooms[id];
                }
            }
            let room2 = this.connectedRooms[id];
            if (room2) {
                if (room2.game == game &&
                    (room2.masterWS === ws || room2.mirrorWS === ws)
                ) {
                    delete this.connectedRooms[id];
                    return room2;
                }
            }
        }
        else {
            for (let index in this.openRooms) {
                let room = this.openRooms[index];
                if (room.game == game && room.masterWS === ws) {
                    delete this.openRooms[index];
                }
            }
        }
        return null;
    }

    close(ws: WS) {
        for (let index in this.openRooms) {
            let room = this.openRooms[index];
            if (room.masterWS === ws) {
                delete this.openRooms[index];
            }
        }
        for (let index in this.reconnectRooms) {
            let room = this.reconnectRooms[index];
            if (room.waiterWS === ws) {
                delete this.reconnectRooms[index];
            }
        }
        for (let index in this.connectedRooms) {
            let room = this.connectedRooms[index];
            if (room.masterWS === ws || room.mirrorWS === ws) {
                delete this.connectedRooms[index];
            }
        }
    }

    private startSession(game: string, master: string, masterWS: WS, mirror: string, mirrorWS: WS, id?: string): ConnectedRoom {
        id = id || this.createRoomId();
        if (this.connectedRooms[id]) {
            return null;
        }

        let type = RoomType.connected;
        let room: ConnectedRoom = {
            type,
            game,
            id,
            master,
            masterWS,
            mirror,
            mirrorWS
        };
        this.connectedRooms[room.id] = room;
        return room;;
    }

    private createRoomId(): string {
        for (;;) {
            let id = uuid.v4();
            if (this.connectedRooms[id] === undefined &&
                this.reconnectRooms[id] === undefined
            ) {
                return id;
            }
        }
    }

    private createPasscode(): string {
        for (;;) {
            let passcode = Math.floor(Math.random() * 10000).toString();
            while (passcode.length > 4) passcode = passcode.substring(1);
            while (passcode.length < 4) passcode = '0' + passcode;
            if (this.openRooms[passcode] === undefined) {
                return passcode;
            }
        }
    }
}
