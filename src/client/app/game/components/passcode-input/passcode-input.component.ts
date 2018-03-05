import { Component, Output, EventEmitter, Input, OnInit, OnDestroy } from '@angular/core';
import { PlayingMode, Game } from '../../game.model';
import { Configuration } from '../../../core/configuration';
import { GamepadService, ButtonEvent, ButtonEventType } from '../../../core/gamepad.service';
import { Unsubscribable } from '../../../core/unsubscribable';

@Component({
    selector: 'passcode-input',
    templateUrl: 'passcode-input.component.html',
    host: {
        '(document:keypress)': 'keyPress($event)'
    }
})
export class PasscodeComponentInput implements OnInit, OnDestroy {
    private subscriptions: Unsubscribable[] = [];

    @Output() select = new EventEmitter<string>();

    @Input() game: Game;
    @Input() passcodeInvalid: boolean

    @Input() set passcode(value: string) {
        value = (value || '').trim();

        for (let i = 0; i < 4; i += 1) {
            let c = value.charCodeAt(i);
            this.digits[i] = (c >= 0x30 && c <= 0x39) ? c - 0x30 : 0;
        }
    }
    get passcode(): string {
        return this.digits.join('');
    }

    selected = 0;
    digits = [0, 0, 0, 0];

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

    selectDigit(index: number) {
        this.selected = index;
    }

    add(add: number) {
        let value = this.digits[this.selected] + add;
        if (value < 0) {
            value = 9;
        }
        else if (value > 9) {
            value = 0;
        }
        this.digits[this.selected] = value;
    }

    buttonDown(event: ButtonEvent): boolean {
        switch (event.button) {
        case 'l':
            if (this.selected > 0) {
                this.selected -= 1;
            }
            else {
                this.selected = 3;
            }
            return true;
        case 'u':
            this.add(-1);
            return true;
        case 'd':
            this.add(1);;
            return true;
        case 'r':
            if (this.selected < 3) {
                this.selected += 1;
            }
            else {
                this.selected = 0;
            }
            return true;
        case 'start':
            this.select.emit(this.passcode);
            return true;
        }
        return false;
    }

    keyPress(event: KeyboardEvent) {
        let value = String.fromCharCode(event.which);
        if (value.length == 1 && value >= '0' && value <= '9') {
            let number = parseInt(value);
            this.digits[this.selected] = number;
            this.selected = (this.selected + 1) % 4;
            event.preventDefault();
        }
    }
}
