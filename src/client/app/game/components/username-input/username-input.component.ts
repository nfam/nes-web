import { Component, Output, EventEmitter, Input, OnInit, OnDestroy } from '@angular/core';
import { PlayingMode, Game } from '../../game.model';
import { Configuration } from '../../../core/configuration';
import { Unsubscribable } from '../../../core/unsubscribable';
import { ButtonEventType, GamepadService, ButtonEvent } from '../../../core/gamepad.service';

@Component({
    selector: 'username-input',
    templateUrl: 'username-input.component.html',
    host: {
        '(document:keypress)': 'keyPress($event)',
        '(document:keydown)': 'keyDown($event)'
    }
})
export class UsernameInputComponent implements OnInit, OnDestroy {
    private subscriptions: Unsubscribable[] = [];
    @Output() select = new EventEmitter<string>();

    index = 0;
    offset = 0;
    fullChars = [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '];
    viewChars = [' ', ' ', ' ', ' '];

    constructor(
        private configuration: Configuration,
        private gamepadService: GamepadService
    ) {
        let username = configuration.username || '';
        for (let i = 0; i < this.fullChars.length; i += 1) {
            let c = username.charAt(i);
            this.fullChars[i] = c || ' ';
        }
        this.viewChars = this.fullChars.slice(0, 4);
    }

    ngOnInit() {
        this.subscriptions.push(
            this.gamepadService.on(ButtonEventType.buttonDown, this.buttonDown.bind(this))
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    selectIndex(index: number) {
        this.index = index;
        if (this.offset > this.index) {
            this.offset = this.index;
            this.viewChars = this.fullChars.slice(this.offset, this.offset + 4);
        }
        else if (this.offset < this.index - 3) {
            this.offset = Math.min(this.index - 3, this.fullChars.length - 4)
            this.viewChars = this.fullChars.slice(this.offset, this.offset + 4);
        }
    }

    buttonDown(event: ButtonEvent): boolean {
        switch (event.button) {
        case 'l':
            this.shift(-1);
            return true;
        case 'u':
            this.update(-1);
            return true;
        case 'd':
            this.update(1);
            return true;
        case 'r':
            this.shift(1);
            return true;
        case 'start':
            this.select.emit(this.configuration.username);
            return true;
        }
        return false;
    }

    keyDown(event: KeyboardEvent) {
        if (event.keyCode == 8) { // backspace
            if (this.index > 0) {
                for (let i = this.index -1; i < this.fullChars.length; i += 1) {
                    this.fullChars[i] = this.fullChars[i+1];
                }
                this.fullChars[this.fullChars.length - 1] = ' ';
                this.viewChars = this.fullChars.slice(this.offset, this.offset + 4);
                this.shift(-1);
                this.save();
            }
            event.preventDefault();
        }
        else if (event.keyCode == 46) { // delete
            if (this.index < this.fullChars.length - 1) {
                for (let i = this.index + 1; i < this.fullChars.length; i += 1) {
                    this.fullChars[i] = this.fullChars[i+1];
                }
                this.fullChars[this.fullChars.length - 1] = ' ';
                this.viewChars = this.fullChars.slice(this.offset, this.offset + 4);
                this.save();
            }
            event.preventDefault();
        }
    }

    keyPress(event: KeyboardEvent) {
        if (event.which != 127 && event.which >= 32) {
            let value = String.fromCharCode(event.which);
            if (value.length == 1) {
                this.update(0, value);
                this.shift(1);
                event.preventDefault();
            }
        }
    }

    update(letterAdd: number, value?: string) {
        let char = this.fullChars[this.index];
        let letterIndex = letters.indexOf(char);
        if (value) {
            char = value;;
        }
        else if (letterIndex < 0) {
            char = ' ';
        }
        else {
            letterIndex += letterAdd;
            if (letterIndex < 0) {
                letterIndex = letters.length - 1;
            }
            else if (letterIndex >= letters.length) {
                letterIndex = 0;
            }
            char = letters.charAt(letterIndex);
        }
        if (this.fullChars[this.index] != char) {
            this.fullChars[this.index] = char;
            this.viewChars[this.index - this.offset] = char;
            this.save();
        }
    }

    private save() {
        let username = this.fullChars.join('').trim().replace('  ', ' ');
        if (this.configuration.username != username) {
            this.configuration.username = username;
        }
    }

    private shift(value: number) {
        let index = this.index + value;
        if (index < 0 || index >= this.fullChars.length) return;
        this.selectIndex(index);
    }
}

const letters = ' 0123456789AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz';