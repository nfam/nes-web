import { Component, Output, EventEmitter, Input, OnInit, OnDestroy } from '@angular/core';
import { PlayingMode, Game } from '../../game.model';
import { Configuration } from '../../../core/configuration';
import { ButtonEvent, GamepadService, ButtonEventType } from '../../../core/gamepad.service';
import { Unsubscribable } from '../../../core/unsubscribable';

@Component({
    selector: 'playingmode-input',
    templateUrl: 'playingmode-input.component.html'
})
export class PlayingModeInputComponent implements OnInit, OnDestroy {
    private subscriptions: Unsubscribable[] = [];

    @Input() game: Game
    @Output() select = new EventEmitter<PlayingMode>();

    PlayingMode = PlayingMode
    mode = PlayingMode.singleplayer

    constructor(
        private configuration: Configuration,
        private gamepadService: GamepadService
    ) {
    }

    ngOnInit() {
        this.subscriptions.push(
            this.gamepadService.on(ButtonEventType.buttonDown, this.buttonDown.bind(this))
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    click(mode: PlayingMode) {
        this.mode = mode;
        this.select.emit(mode);
    }

    buttonDown(event: ButtonEvent): boolean {
        switch (event.button) {
        case 'tab':
            this.mode = this.mode == PlayingMode.multiplayer ? PlayingMode.singleplayer : PlayingMode.multiplayer;
            return true;
        case 'l':
        case 'u':
            this.mode = PlayingMode.singleplayer;
            return true;
        case 'r':
        case 'd':
            this.mode = PlayingMode.multiplayer;
            return true;
        case 'start':
            if (this.mode) {
                this.click(this.mode);
            }
            return true;
        }
        return false;
    }
}
