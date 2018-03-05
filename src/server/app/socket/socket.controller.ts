
import * as Express from 'express';
import * as WS from 'ws';

import { Socket } from '../core/socket';
import LogService from '../core/log.service';
import { RoomRequest, RoomResponse, RoomSignal, RoomType, Room, OpenRoom, ConnectedRoom, ReconnectRoom } from '../room/room.model';
import RoomService from '../room/room.service';
import { reset } from 'nconf';

export default class SocketController {

    static $inject = [
        'logService',
        'roomService'
    ];
    constructor(
        private logService: LogService,
        private roomService: RoomService
    ) {
    }

    router(): Express.RequestHandler {
        var router = Express.Router();

        (router as any).ws('/', (ws: WS, req: Express.Request) => {
            ws.on('message', (msg: any) => {
                let message = Socket.deserialize(msg);
                if (message == 'tick') {
                    return;
                }
                if (typeof message.name == 'string') {
                    if (message.name == 'room') {
                        if (this.handleRoomRequest(message.value, ws)) {
                            return;
                        }
                    }
                    else if (message.name == 'room.signal') {
                        if (this.handleRoomSignal(message.value as RoomSignal, ws)) {
                            return;
                        }
                    }
                }
                this.logService.error('Unable to parse websocket message', msg);
            });

            ws.on('close', () => {
                this.roomService.close(ws);
            });
        });

        return router;
    }

    private handleRoomRequest(rq: RoomRequest, ws: WS): boolean {
        let result: Room;
        switch (rq.type) {
        case 'anyone':
            if (rq.game && rq.username) {
                result = this.roomService.anyone(rq.game, rq.username, ws);
            }
            else {
                this.logService.warn('room-request: [anyone] Missing game and/or username');
                return false;
            }
            break;
        case 'create':
            if (rq.game && rq.username) {
                result = this.roomService.create(rq.game, rq.username, ws, false);
            }
            else {
                this.logService.warn('room-request: [create] Missing game and/or username');
                return false;
            }
            break;
        case 'join':
            if (rq.passcode && rq.username) {
                result = this.roomService.join(rq.passcode, rq.username, ws);
            }
            else {
                this.logService.warn('room-request: [join] Missing passcode and/or username');
                return false;
            }
            break;
        case 'masterReconnect':
        case 'mirrorReconnect':
            if (rq.id && rq.game && rq.username) {
                result = this.roomService.reconnect(rq.id, rq.game, rq.username, ws, rq.type == 'masterReconnect');
            }
            else {
                this.logService.warn('room-request: ['+rq.type+'] Missing id, game and/or username');
                return false;
            }
            break;
        case 'abandon':
            if (rq.game) {
                let room = this.roomService.abandon(rq.game, rq.id, ws);
                if (room) {
                    let sender: string;
                    let receiver: string;
                    let receiverWS: WS;
                    if (room.masterWS === ws) {
                        sender = room.master;
                        receiver = room.mirror;
                        receiverWS = room.mirrorWS;
                    }
                    else if (room.mirrorWS === ws) {
                        sender = room.mirror;
                        receiver = room.master;
                        receiverWS = room.masterWS;
                    }
                    if (receiverWS) {
                        let response: RoomResponse = {
                            status: 'abandoned',
                            game: room.game,
                            this: receiver,
                            that: sender,
                            id: room.id
                        };
                        receiverWS.send(Socket.serialize({
                            name: 'room',
                            value: response
                        }));
                    }
                }
                return true;
            }
            this.logService.warn('room-request: [abandon] Missing game');
            return false;
        default:
            this.logService.warn('room-request: Invalid type ' + rq.type);
            return false;
        }

        switch (result ? result.type : null) {
        case RoomType.open:
            {
                let room = result as OpenRoom;
                let response: RoomResponse = {
                    status: 'created',
                    game: room.game,
                    this: room.master
                };
                if (room.passcode) {
                    response.passcode = room.passcode;
                }
                ws.send(Socket.serialize({
                    name: 'room',
                    value: response
                }));
            }
            break;
        case RoomType.reconnect:
            {
                let room = result as ReconnectRoom;
                let response: RoomResponse = {
                    status: 'reconnect',
                    game: room.game,
                    this: room.waiter,
                    id: room.id
                };
                ws.send(Socket.serialize({
                    name: 'room',
                    value: response
                }));
            }
            break;
        case RoomType.connected:
            {
                let room = result as ConnectedRoom;
                let masterResponse: RoomResponse = {
                    status: 'masterJoined',
                    game: room.game,
                    this: room.master,
                    that: room.mirror,
                    id: room.id
                };
                room.masterWS.send(Socket.serialize({
                    name: 'room',
                    value: masterResponse
                }));

                let mirrorResponse: RoomResponse = {
                    status: 'mirrorJoined',
                    game: room.game,
                    this: room.mirror,
                    that: room.master,
                    id: room.id
                };
                room.mirrorWS.send(Socket.serialize({
                    name: 'room',
                    value: mirrorResponse
                }));
            }
            break;
        default:
            let errorResponse: RoomResponse = {
                status: rq.type == 'join' ? 'passcodeInvalid' : 'roomIdInvalid',
                game: rq.game || '',
                this: rq.username
            };
            ws.send(Socket.serialize({
                name: 'room',
                value: errorResponse
            }));
        }
        return true;
    }

    private handleRoomSignal(rs: RoomSignal, ws: WS): boolean {
        if (rs.id && rs.signal) {
            let room = this.roomService.getConnectedRoom(rs.id);
            if (room) {
                if (ws === room.masterWS && room.mirrorWS) {
                    room.mirrorWS.send(Socket.serialize({
                        name: 'room.signal',
                        value: rs.signal
                    }));
                }
                else if (ws === room.mirrorWS && room.masterWS) {
                    room.masterWS.send(Socket.serialize({
                        name: 'room.signal',
                        value: rs.signal
                    }));
                }
            }
            return true;
        }
        else {
            this.logService.warn('room-signal: Missing id and/or signal');
            return false;
        }
    }
}
