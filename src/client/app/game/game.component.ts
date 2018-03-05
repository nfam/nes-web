import { Component, Input, OnDestroy, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { Game, PlayingMode, RoomOption } from './game.model';
import { GameService } from './game.service';
import { PlayingService, PlayingStatus } from '../core/playing.service';
import { RoomStatus, Room } from '../room/room.model';
import { RoomService } from '../room/room.service';
import { Configuration } from '../core/configuration';
import { ButtonEvent, GamepadService, ButtonEventType } from '../core/gamepad.service';
import { Unsubscribable } from '../core/unsubscribable';

@Component({  
    templateUrl: 'game.component.html'
})
export class GameComponent implements OnInit, OnDestroy {
    private subscriptions: Unsubscribable[] = [];

    name: string = null;
    game: Game = null;
    message: string = null;

    PlayingMode = PlayingMode;
    playingMode: PlayingMode = null;

    RoomStatus = RoomStatus;
    roomStatus: RoomStatus = null;
    room: Room = null;

    Option = Option;
    option: Option;
    showingExitQuery = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private configuration: Configuration,
        private gameService: GameService,
        private roomService: RoomService,
        private playingService: PlayingService,
        private gamepadService: GamepadService
    ) {
    }

    ngOnInit() {
        this.subscriptions.push(
            this.route.params.subscribe(params => {
                this.name = params.name;
                this.gameService.getGame(this.name)
                .then(game => {
                    this.game = game;
                    if (!game.multiplayer) {
                        this.playingMode = PlayingMode.singleplayer;
                    }
                    this.gameService.getRom(game.name)
                    .then(rom => this.playingService.load(game.name, rom));
                })
                .catch(error => {
                    this.game = null;
                    this.message = error.message;
                });
            })
        );
        this.subscriptions.push(
            this.roomService.status.subscribe(roomStatus => {
                this.roomStatus = roomStatus;
                if (this.roomStatus == RoomStatus.passcodeInvalid) {
                    this.showingPasscodeInput = true;
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
        this.playingService.pause();
        this.roomService.abandon();
    }

    back() {
        if (!this.showingExitQuery && this.room) {
            if (this.showingMasterScreen) {
                this.playingService.pause();
                this.showingExitQuery = true;
                this.option = Option.no;
                return;
            }
            else if  (this.showingMirrorScreen) {
                this.roomService.sendRequest('pause');
                this.showingExitQuery = true;
                this.option = Option.no;
                return;
            }
        }
        this.showingExitQuery = false;

        if (this.playingMode == PlayingMode.singleplayer) {
            this.playingService.pause();
            this.router.navigateByUrl('/');
        }
        else if (this.playingMode == PlayingMode.multiplayer) {
            if (this.roomStatus || this.showingUsernameInput || this.showingPasscodeInput) {
                this.roomStatus = null;
                this.showingUsernameInput = false;
                this.showingPasscodeInput = false;
                this.passcode = null;
                if (!this.configuration.username || this.configuration.username.length == 0) {
                    this.playingMode = null;
                }
            }
            else {
                this.playingMode = null;
            }
            this.playingService.pause();
            this.roomService.abandon();
        }
        else {
            this.router.navigateByUrl('/');
        }
    }

    get showingPlayingModeInput(): boolean {
        return this.game && this.game.multiplayer &&
            this.playingMode == null;
    }

    selectPlayingMode(mode: PlayingMode) {
        this.playingMode = mode;
        if (this.playingMode == PlayingMode.multiplayer) {
            if (!this.configuration.username || this.configuration.username.length == 0) {
                this.showingUsernameInput = true;
            }
        }
    }

    get showingRoomOptionInput(): boolean {
        return this.game && this.game.multiplayer &&
            this.playingMode == PlayingMode.multiplayer &&
            this.roomStatus === null &&
            !this.showingUsernameInput &&
            !this.showingPasscodeInput;
    }

    selectRoomOption(option: RoomOption) {
        switch (option) {
        case RoomOption.username:
            this.showingUsernameInput = true;
            break;
        case RoomOption.anyone:
            this.roomService.connectAnyone(this.name);
            break;
        case RoomOption.create:
            this.roomService.createPrivate(this.name);
            break;
        case RoomOption.join:
            this.showingPasscodeInput = true;
            break;
        }
    }

    showingUsernameInput = false;
    selectUsername() {
        this.showingUsernameInput = false;
    }

    showingPasscodeInput = false;
    passcode: string = null;
    selectPasscode(passcode: string) {
        this.showingPasscodeInput = false;
        this.passcode = passcode;
        this.roomService.joinPrivate(this.name, passcode);
    }

    get showingConnectionStatus(): boolean {
        return this.game &&
            this.playingMode == PlayingMode.multiplayer &&
            this.roomStatus !== null &&
            this.roomStatus != RoomStatus.peerConnected &&
            !this.showingPasscodeInput;
    }

    selectAbandon() {
        this.roomService.abandon();
    }

    get showingMasterScreen(): boolean {
        return this.game && (
            this.playingMode == PlayingMode.singleplayer || (
                this.playingMode == PlayingMode.multiplayer &&
                this.room && this.room.asmaster &&
                this.roomStatus == RoomStatus.peerConnected
            )
        );
    }

    get showingMirrorScreen(): boolean {
        return this.game &&
            this.playingMode == PlayingMode.multiplayer &&
            this.room && !this.room.asmaster &&
            this.roomStatus == RoomStatus.peerConnected;
    }

    get playerI(): string {
        if (this.game &&
            this.playingMode == PlayingMode.multiplayer &&
            this.room
        ) {
            if (this.room.asmaster) {
                if (this.room.this) {
                    return this.room.this;
                }
            }
            else {
                if (this.room.that) {
                    return this.room.that;
                }
            }
        } 
        return null;
    }

    get playerII(): string {
        if (this.game &&
            this.playingMode == PlayingMode.multiplayer &&
            this.room
        ) {
            if (this.room.asmaster) {
                if (this.room.that) {
                    return this.room.that;
                }
            }
            else {
                if (this.room.this) {
                    return this.room.this;
                }
            }
        } 
        return null;
    }

    buttonDown(event: ButtonEvent): boolean {
        if (event.button == 'ls1') {
            this.back();
            return true;
        }
        else if (this.showingExitQuery) {
            switch (event.button) {
            case 'tab':
                this.option = this.option ? 0 : 1;
                return true;
            case 'l':
            case 'u':
                this.option = Option.yes;
                return true;
            case 'r':
            case 'd':
                this.option = Option.no;
                return true;
            case 'start':
                if (this.option == Option.yes) {
                    this.back();
                }
                else {
                    this.showingExitQuery = false;
                }
                return true;
            }
        }
        return false;
    }
}


enum Option {
    yes,
    no
};