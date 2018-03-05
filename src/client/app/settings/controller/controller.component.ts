import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Configuration } from '../../core/configuration';
import { State } from './state.model';
import { Unsubscribable } from '../../core/unsubscribable';
import { GamepadService, ButtonEventType, ButtonEvent } from '../../core/gamepad.service';

@Component({
    selector: 'controller',
    templateUrl: 'controller.component.html',
    host: {
        '(document:keydown)': 'keyDown($event)'
    },
})
export class ControllerComponent implements OnInit, OnDestroy {
    private subscriptions: Unsubscribable[] = [];
    state: State = { selectedButton: null };

    constructor(
        private router: Router,
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

    get keyboardMapModified(): boolean {
        return this.configuration.keyboardMapModified;
    }

    resetKeyboardMap() {
        this.configuration.resetKeyboardMap();
    }

    buttonDown(event: ButtonEvent): boolean {
        if (event.button == 'ls1') {
            this.router.navigateByUrl('/settings');
            return true;
        }
    }
    
    keyDown(event: KeyboardEvent) {
        if (event.keyCode == 27) { // ESC
            this.router.navigateByUrl('/settings');
            event.preventDefault();
        }
        else if (event.keyCode == 9) { // TAB
            if (typeof this.state.selectedButton === 'number') {
                switch (this.state.selectedButton) {
                case 'u':
                    this.state.selectedButton = 'l';
                    break;
                case 'l':
                    this.state.selectedButton = 'd';
                    break;
                case 'd':
                    this.state.selectedButton = 'r';
                    break;
                case 'r':
                    this.state.selectedButton = 'select';
                    break;
                case 'select':
                    this.state.selectedButton = 'start';
                    break;
                case 'start':
                    this.state.selectedButton = 'B';
                    break;
                case 'B':
                    this.state.selectedButton = 'A';
                    break;
                case 'A':
                    this.state.selectedButton = 'b';
                    break;
                case 'b':
                    this.state.selectedButton = 'a';
                    break;
                case 'a':
                default:
                    this.state.selectedButton = 'u';
                }
            }
            else {
                this.state.selectedButton = 'u';
            }
            event.preventDefault();
            return true;
        }
        else if (typeof this.state.selectedButton === 'number') {
            let button = this.configuration.buttonOfKey(event.keyCode);
            if (!button) {
                this.configuration.setKeyboardMap(this.state.selectedButton, event.keyCode);
                event.preventDefault();
            }
        }
    }
}
