import { Component, Input } from '@angular/core';
import { ControllerButton } from 'tsnes';
import { State } from './state.model';

@Component({
    selector: 'joystick',
    templateUrl: 'joystick.component.svg.html',
    styles: ['svg { max-width: 100%; display: inline-block; }']
})
export class JoystickComponent {

    @Input()
    set state(value: State) {
        this._state = value;
    }
    get state(): State {
        return this._state || { selectedButton: null };
    }
    _state: State;

    clickOutside(button: ControllerButton, event: { target: EventTarget }): void {
        if (this.state && this.state.selectedButton === button) {
            if (event && event.target instanceof SVGElement
            && ((event.target as SVGElement).getAttribute('class')||'').indexOf('selected') >= 0) {
                return;
            }
            this.state.selectedButton = null;
        }
    }
}
