import { Component, OnInit, OnDestroy, Output, Input, EventEmitter } from '@angular/core';
import { Configuration } from '../../../core/configuration';
import { GamepadService, ButtonEventType, ButtonEvent } from '../../../core/gamepad.service';
import { Unsubscribable } from '../../../core/unsubscribable';
import { RoomStatus, Room } from '../../../room/room.model';
import { RoomService } from '../../../room/room.service';
import { Game } from '../../game.model';

@Component({
    selector: 'connection-status',
    templateUrl: 'connection-status.component.html'
})
export class ConnectionStatusComponent implements OnInit, OnDestroy {
    private subscriptions: Unsubscribable[] = [];

    @Output() abandon = new EventEmitter<void>();
    @Input() game: Game
    Option = Option;

    RoomStatus = RoomStatus;
    status: RoomStatus = null;
    room: Room = null;
    selected: Option = null;

    constructor(
        private configuration: Configuration,
        private gamepadService: GamepadService,
        private roomService: RoomService
    ) {
    }

    ngOnInit() {
        this.subscriptions.push(
            this.roomService.status.subscribe(status => {
                this.status = status;
                switch (status) {
                case RoomStatus.abandoned:
                    this.selected = Option.cancel;
                    break;
                case RoomStatus.serverFailed:
                case RoomStatus.serverDisconnected:
                case RoomStatus.peerDisconnected:
                    this.selected = Option.retry;
                    break;
                default:
                    this.selected = null;
                    break;
                }
             })
        );
        this.subscriptions.push(
            this.roomService.room.subscribe(room => this.room = room)
        );

        this.subscriptions.push(
            this.gamepadService.on(ButtonEventType.buttonDown, this.buttonDown.bind(this))
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    buttonDown(event: ButtonEvent): boolean {
        switch (event.button) {
        case 'tab':
            return this.tab();
        case 'l':
        case 'u':
        case 'r':
        case 'd':
        case 'select':
            return this.tab();
        case 'start':
            if (this.selected === Option.retry) {
                this.retry();
            }
            else if (this.selected === Option.cancel) {
                this.cancel();
            }
            return true;
        }
        return false;
    }

    private tab(): boolean {
        switch (this.status) {
        case RoomStatus.serverConnect:
        case RoomStatus.serverConnected:
        case RoomStatus.serverWaiting:
        case RoomStatus.peerConnect:
        case RoomStatus.peerReconnect:
        case RoomStatus.abandoned:
            this.selected = Option.cancel;
            break;
        case RoomStatus.serverFailed:
        case RoomStatus.serverDisconnected:
        case RoomStatus.peerDisconnected:
            if (this.selected === Option.retry) {
                this.selected = Option.cancel;
            }
            else {
                this.selected = Option.retry;
            }
            break;
        }
        return true;
    }

    retry() {
        if (this.room && this.room.id) {
            this.roomService.reconnect();
        }
        else {
            this.roomService.reset();
        }
    }

    cancel() {
        this.abandon.emit();
    }
}

enum Option {
    retry,
    cancel
}
