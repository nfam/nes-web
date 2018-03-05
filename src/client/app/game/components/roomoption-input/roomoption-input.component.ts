import { Component, Output, EventEmitter, Input, OnInit, OnDestroy } from '@angular/core';
import { RoomOption, Game } from '../../game.model';
import { Configuration } from '../../../core/configuration';
import { GamepadService, ButtonEventType, ButtonEvent } from '../../../core/gamepad.service';
import { Unsubscribable } from '../../../core/unsubscribable';

@Component({
    selector: 'roomoption-input',
    templateUrl: 'roomoption-input.component.html'
})
export class RoomOptionInputComponent implements OnInit, OnDestroy {
    private subscriptions: Unsubscribable[] = [];

    @Input() game: Game
    @Output() select = new EventEmitter<RoomOption>();

    RoomOption = RoomOption
    selected = RoomOption.username

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

    click(option: RoomOption) {
        this.select.emit(option);
    }

    get username(): string {
        return this.configuration.username;
    }

    buttonDown(event: ButtonEvent) {
        switch (event.button) {
        case 'tab':
            if (this.selected === null) {
                this.selected = RoomOption.username;
            }
            else if (this.selected == RoomOption.join) {
                this.selected = RoomOption.username;
            }
            else {
                let next = nextOptions['r'];
                if (next[this.selected] !== undefined) {
                    this.selected = next[this.selected];
                }
            }
            return true;
        case 'l':
        case 'u':
        case 'r':
        case 'd':
            if (this.selected === null) {
                this.selected = RoomOption.username;
            }
            else {
                let next = nextOptions[event.button];
                if (next[this.selected] !== undefined) {
                    this.selected = next[this.selected];
                }
            }
            return true;
        case 'start':
            if (this.selected !== null) {
                this.click(this.selected);
            }
            return true;
        }
        return false;
    }
}

/*
+----------+----------+
| username |  anyone  |
+----------+----------+
| create   |   join   |
+----------+----------+
*/
type NextOption =  { [current: string]: RoomOption };
const nextOptions: { [button: string]: NextOption } = {};

{
    let up = nextOptions['u'] = {};
    up[RoomOption.anyone] = RoomOption.username;
    up[RoomOption.create] = RoomOption.username;
    up[RoomOption.join] = RoomOption.anyone;
}
{
    let right = nextOptions['r'] = {};
    right[RoomOption.username] = RoomOption.anyone;
    right[RoomOption.anyone] = RoomOption.create;
    right[RoomOption.create] = RoomOption.join;
}
{
    let down = nextOptions['d'] = {};
    down[RoomOption.username] = RoomOption.create;
    down[RoomOption.anyone] = RoomOption.join;
    down[RoomOption.create] = RoomOption.join;
}
{
    let left = nextOptions['l'] = {};
    left[RoomOption.anyone] = RoomOption.username;
    left[RoomOption.create] = RoomOption.anyone;
    left[RoomOption.join] = RoomOption.create;
}