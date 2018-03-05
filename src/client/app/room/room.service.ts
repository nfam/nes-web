import { Injectable, Inject } from '@angular/core';
import { SocketService } from '../core/socket.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Room, RoomStatus, RoomResponse, RoomRequest } from './room.model';
import { Socket } from '../core/socket';
import { ControllerButton, Output } from 'tsnes';
import { PlayingService, PlayingStatus } from '../core/playing.service';
import OutputProcessor, { OutputData } from './output-processor';
import InputProcessor from './input-processor';
import { Configuration } from '../core/configuration';

@Injectable()
export class RoomService {

    private _status = new BehaviorSubject<RoomStatus>(null);
    private _room = new BehaviorSubject<Room>(null);

    private _mirrorStatus = new BehaviorSubject<PlayingStatus>(null);
    private _mirrorOutput = new BehaviorSubject<Output>(null);

    private peer: any;
    private outputProcessor: OutputProcessor = null;
    private inputProcessor: InputProcessor = null;

    constructor(
        private configuration: Configuration,
        private playingService: PlayingService,
        private socketService: SocketService
    ) {
        if (this.configuration.mirrorRoom && this.configuration.username) {
            let room: Room = {
                game: this.configuration.mirrorRoom.game,
                asmaster: false,
                this: this.configuration.username,
                id: this.configuration.mirrorRoom.id
            }
            this._status.next(RoomStatus.peerDisconnected);
            this._room.next(room);
        }

        this.socketService.status.subscribe(status => {
            if (status == 'closed') {
                let status = this._status.getValue();
                switch (status) {
                case RoomStatus.serverConnect:
                    this._status.next(RoomStatus.serverFailed);
                    break;
                case RoomStatus.serverWaiting:
                case RoomStatus.peerConnect:
                case RoomStatus.peerWaiting:
                case RoomStatus.peerReconnect:
                    this._status.next(RoomStatus.serverDisconnected);
                    break;
                }
            }
        });
        this.playingService.status.subscribe(status => {
            let room = this._room.getValue();
            if (this.peer && room && room.asmaster &&  (
                status == PlayingStatus.ready ||
                status == PlayingStatus.running ||
                status == PlayingStatus.paused
            )) {
                this.peerSend('status', status);
            }
        });
        this.playingService.output.subscribe(output => {
            let room = this._room.getValue();
            if (this.peer &&
                room &&
                room.asmaster &&
                this._status.getValue() == RoomStatus.peerConnected
            ) {
                if (!this.outputProcessor) {
                    this.outputProcessor = new OutputProcessor();
                }
                let result = this.outputProcessor.process(output);
                if (result) {
                    this.peerSend('output', result);
                }
            }
        });
        this.socketService.subscribe('room', (data) => {
            let room = this._room.getValue();
            let response = data as RoomResponse;
            switch (response.status) {
            case 'created':
                if (!room) {
                    room = {
                        game: response.game,
                        asmaster: true,
                        this: response.this,
                    };
                    if (response.passcode) {
                        room.passcode = response.passcode;
                    }
                    this._status.next(RoomStatus.serverWaiting);
                    this._room.next(room);
                }
                break;
            case 'masterJoined':
                if (room && room.asmaster &&
                    room.game == response.game &&
                    room.this == response.this &&
                    (!room.id || room.id == response.id)
                ) {
                    room.that = response.that;
                    room.id = response.id;

                    this._status.next(RoomStatus.peerWaiting);
                    this._room.next(room);
                }
                break;
            case 'mirrorJoined':
                if (!room) {
                    room = {
                        game: response.game,
                        asmaster: false,
                        this: response.this,
                        that: response.that,
                        id: response.id
                    };
                    this.configuration.mirrorRoom = {
                        game: room.game,
                        id: room.id
                    };
                    this._status.next(RoomStatus.peerConnect);
                    this._room.next(room);
                    this.peerOffer();
                }
                else if (room && !room.asmaster &&
                    room.game == response.game &&
                    room.this == response.this &&
                    room.id == response.id
                ) {
                    this._status.next(RoomStatus.peerConnect);
                    if (room.that != response.that) {
                        room.that = response.that;
                        this._room.next(room);
                    }
                    this.peerOffer();
                }
                break;
            case 'reconnect':
                if (room &&
                    room.game == response.game &&
                    room.this == response.this &&
                    room.id == response.id
                ) {
                    this._status.next(RoomStatus.peerReconnect);
                }
                break;
            case 'passcodeInvalid':
                if (!room) {
                    this._status.next(RoomStatus.passcodeInvalid);
                }
                break;
            case 'roomIdInvalid':
                if (room &&
                    room.game == response.game &&
                    room.this == response.this &&
                    room.id == response.id
                ) {
                    this._status.next(RoomStatus.roomIdInvalid);
                }
                break;
            case 'abandoned':
                if (room &&
                    room.game == response.game &&
                    room.this == response.this &&
                    room.id == response.id &&
                    this._status.getValue() != RoomStatus.abandoned
                ) {
                    this._status.next(RoomStatus.abandoned);
                }
                break;
            }
        });
        this.socketService.subscribe('room.signal', (data) => {
            if (this.peer) {
                this.peer.signal(data);
            }
            else {
                let room = this._room.getValue();
                if (room && room.asmaster) {
                    this.peerAnswer(data);
                }
            }
        });
    }

    get status(): Observable<RoomStatus> {
        return this._status;
    }

    get room(): Observable<Room> {
        return this._room;
    }

    get mirrorStatus(): Observable<PlayingStatus> {
        return this._mirrorStatus;
    }

    get mirrorOutput(): Observable<Output> {
        return this._mirrorOutput;
    }

    // To Server
    connectAnyone(game: string) {
        if (this._status.getValue() !== null) return;
        this.connect({
            type: 'anyone',
            game: game,
            username: this.configuration.username
        });
    }

    createPrivate(game: string) {
        if (this._status.getValue() !== null) return;
        this.connect({
            type: 'create',
            game: game,
            username: this.configuration.username
        });
    }

    joinPrivate(game: string, passcode: string) {
        let status = this._status.getValue();
        if (status !== null && status !== RoomStatus.passcodeInvalid) return;
        this.connect({
            type: 'join',
            game: game,
            username: this.configuration.username,
            passcode: passcode
        });
    }

    reconnect() {
        let room = this._room.getValue();
        if (room && room.id) {
            this.connect({
                type: room.asmaster ? 'masterReconnect' : 'mirrorReconnect',
                game: room.game,
                username: room.this,
                id: room.id
            });
        }
    }

    private connect(request: RoomRequest) {
        this._status.next(RoomStatus.serverConnect);
        this.socketService.socketReady()
        .then(socket => {
            this._status.next(RoomStatus.serverConnected);
            socket.send({ name: 'room', value: request });
        })
        .catch(error => {
            this._status.next(RoomStatus.serverFailed);
        });
    }

    reset() {
        this.configuration.mirrorRoom = null;
        this._status.next(null);
        let room = this._room.getValue();
        if (room) {
            this._room.next(null);
        }
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
    }

    abandon() {
        let room = this._room.getValue();
        if (room) {
            // Tell the peer that I has abandoned the game if connected.
            let status = this._status.getValue();
            if (this.peer && status == RoomStatus.peerConnected) {
                this.peerSend('abandoned');
            }

            // Tell the peer that I has abandoned the game if connted.
            let socket = this.socketService.socketConnected();
            if (socket) {
                let args: RoomRequest = {
                    type: 'abandon',
                    game: room.game,
                    username: room.this,
                    id: room.id || undefined
                };
                socket.send({
                    name: 'room',
                    value: args
                });
            }
        }

        // clean up everything
        this.reset();
    }

    // Slave to Master
    sendButtonDown(button: ControllerButton) {
        this.peerSend('buttonDown', button);
    }

    sendButtonUp(button: ControllerButton) {
        this.peerSend('buttonUp', button);
    }

    sendRequest(value: 'pause'|'resume') {
        this.peerSend('request', value);
    }

    // Mirror connects to the Master.
    private peerOffer() {
        this.peer = new (window as any).SimplePeer({ initiator: true, trickle: false });
        this.peerOnEvents();
        this.peer.on('data', (data: ArrayBuffer) => {
            let status = this._status.getValue();
            if (status == RoomStatus.peerConnect) {
                status = RoomStatus.peerConnected;
                this._status.next(status);
            }

            let message = Socket.deserialize(data) as MasterMessage;
            if (!message) return;

            switch (message.type) {
            case 'abandoned':
                if (status !== null && status != RoomStatus.abandoned) {
                    this._status.next(RoomStatus.abandoned);
                }
                break;
            case 'status':
                if (message.data && typeof PlayingStatus[message.data as PlayingStatus]) {
                    this._mirrorStatus.next(message.data as PlayingStatus);
                }
                break;
            case 'output':
                if (message.data && (message.data as OutputData).frame && (message.data as OutputData).audio8) {
                    if (!this.inputProcessor) {
                        this.inputProcessor = new InputProcessor();
                    }
                    let output = this.inputProcessor.process(message.data as OutputData);
                    if (output) {
                        this._mirrorOutput.next(output);
                    }
                }
                break;
            }
        });
    }

    // Master answers to the Mirror.
    private peerAnswer(signalData: any) {
        this.peer = new (window as any).SimplePeer({ initiator: false, trickle: false });
        this.peerOnEvents();
        this.peer.on('connect', () => {
            let room = this._room.getValue();
            if (room) {
                this._status.next(RoomStatus.peerConnected);
                this.peerSend('status', PlayingStatus.ready);
            }
        });
        this.peer.on('data', (data: ArrayBuffer) => {
            let message = Socket.deserialize(data) as MirrorMessage;
            if (!message) return;
            switch (message.type) {
            case 'abandoned':
                this.playingService.pause();
                let status = this._status.getValue();
                if (status !== null && status != RoomStatus.abandoned) {
                    this._status.next(RoomStatus.abandoned);
                }
                break;
            case 'request':
                switch (message.data) {
                case 'pause':
                    this.playingService.pause();
                    break;
                case 'resume':
                    this.playingService.resume();
                    break;
                }
                break;
            case 'buttonDown':
                if (message.data) {
                    this.playingService.buttonDown(2, message.data as ControllerButton);
                }
                break;
            case 'buttonUp':
                if (message.data) {
                    this.playingService.buttonUp(2, message.data as ControllerButton);
                }
                break;
            }
        });
        this.peer.signal(signalData);
    }

    private peerOnEvents() {
        this.peer.on('signal', (data: any) => {
            this.socketService.socketReady()
            .then(socket => {
                let room = this._room.getValue();
                if (room && room.id) {
                    socket.send({
                        name: 'room.signal',
                        value: {
                            id: room.id,
                            signal: data
                        }
                    });
                }
            })
            .catch(error => {
                this.peer.destroy();
                this.peer = null;
                this._status.next(RoomStatus.peerDisconnected);
            });
        });
        this.peer.on('close', this.peerClosed.bind(this));
    }

    private peerSend(type: MasterMessageType | MirrorMessageType, data?: any) {
        if (this.peer) {
            let d = Socket.serialize({ type, data });
            try {
                this.peer.send(d);
            }
            catch (e) {
                //this.peerClosed();
            }
        }
    }

    private peerClosed() {
        this.playingService.pause();
        this.inputProcessor = null;
        this.outputProcessor = null;
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        let status = this._status.getValue();
        if (status !== null && status != RoomStatus.abandoned) {
            this._status.next(RoomStatus.peerDisconnected);
        }
    }
}

type MasterMessageType = 'abandoned' | 'status' | 'output';
interface MasterMessage {
    type: MasterMessageType,
    data?: PlayingStatus | OutputData
}

type MirrorMessageType = 'abandoned' | 'request' | 'buttonDown' | 'buttonUp';
interface MirrorMessage {
    type: MirrorMessageType,
    data?: 'pause' | 'resume'| ControllerButton
}