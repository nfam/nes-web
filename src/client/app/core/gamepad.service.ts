import { Injectable } from '@angular/core';
import { ControllerButton } from 'tsnes';
import { Configuration } from './configuration';
import { Unsubscribable } from './unsubscribable';

const _getGamepads = navigator.getGamepads || navigator.webkitGetGamepads;
const getGamepads = _getGamepads ? _getGamepads.bind(navigator) : null;
const axisDelay = 150;

export type GamepadButton = ControllerButton | 'ls1' | 'ls2' | 'rs1' | 'rs2' | 'tab';

@Injectable()
export class GamepadService {
    private keyDownCallbacks: Callback[] = [];
    private keyUpCallbacks: Callback[] = [];

    private padState1 = new GamepadState(1);
    private padState2 = new GamepadState(2);

    constructor(private configuration: Configuration) {
    }

    on(eventType: ButtonEventType, callback: (event: ButtonEvent) => boolean): Unsubscribable {
        switch (eventType) {
        case ButtonEventType.buttonDown:
            this.keyDownCallbacks.push(callback);
            return {
                unsubscribe: () => {
                    for (let i = this.keyDownCallbacks.length - 1; i >= 0; i -= 1) {
                        let s = this.keyDownCallbacks[i];
                        if (s === callback) {
                            this.keyDownCallbacks.splice(i, 1);
                        }
                    }
                }
            };
        case ButtonEventType.buttonUp:
            this.keyUpCallbacks.push(callback);
            return {
                unsubscribe: () => {
                    for (let i = this.keyUpCallbacks.length - 1; i >= 0; i -= 1) {
                        let s = this.keyUpCallbacks[i];
                        if (s === callback) {
                            this.keyUpCallbacks.splice(i, 1);
                        }
                    }
                }
            };
        default:
            return null;
        }
    }

    keyDown(event: KeyboardEvent): boolean {
        let buttonEvent = this.getButtonEvent(event);
        return buttonEvent ? this.fireButtonDown(buttonEvent) : false;
    }

    keyUp(event: KeyboardEvent): boolean {
        let buttonEvent = this.getButtonEvent(event);
        return buttonEvent ? this.fireButtonUp(buttonEvent) : false;
    }

    frame() {
        if (getGamepads) {
            const pads = getGamepads();
            for (let i = 0; i < pads.length && i < 2; i += 1) {
                let state = i == 0 ? this.padState1 : this.padState2;
                let pad = pads[i];
                if (pad) {
                    this.checkGamepad(pad, state);
                }
            }
        }
    }

    private checkGamepad(pad: Gamepad.Gamepad, state: GamepadState) {
        // left - right
        {
            if (pad.axes[0] < -0.5) {
                if (state.axis0) {
                    if (state.axis0 == -1) {
                        if (Date.now() - state.axis0Time >= axisDelay) {
                            state.axis0 = 0;
                        }
                    }
                    else if (state.axis0 == 1) {
                        state.axis0 = 0;
                        this.fireButtonUp({
                            player: state.player,
                            button: 'r',
                            isNesButton: true
                        });
                    }
                }
                if (state.axis0 == 0) {
                    state.axis0 = -1;
                    state.axis0Time = Date.now();
                    this.fireButtonDown({
                        player: state.player,
                        button: 'l',
                        isNesButton: true
                    });
                }
            }
            else if (pad.axes[0] > 0.5) {
                if (state.axis0) {
                    if (state.axis0 == -1) {
                        state.axis0 = 0;
                        this.fireButtonUp({
                            player: state.player,
                            button: 'l',
                            isNesButton: true
                        });
                    }
                    else if (state.axis0 == 1) {
                        if (Date.now() - state.axis0Time >= axisDelay) {
                            state.axis0 = 0;
                        }
                    }
                }
                if (state.axis0 == 0) {
                    state.axis0 = 1;
                    state.axis0Time = Date.now();
                    this.fireButtonDown({
                        player: state.player,
                        button: 'r',
                        isNesButton: true
                    });
                }
            }
            else if (state.axis0) {
                this.fireButtonUp({
                    player: state.player,
                    button: state.axis0 == -1 ? 'l' : 'r',
                    isNesButton: true
                });
                state.axis0 = 0;
            }
        }

        // up - down
        {
            if (pad.axes[1] < -0.5) {
                if (state.axis1) {
                    if (state.axis1 == -1) {
                        if (Date.now() - state.axis1Time >= axisDelay) {
                            state.axis1 = 0;
                        }
                    }
                    else if (state.axis1 == 1) {
                        state.axis1 = 0;
                        this.fireButtonUp({
                            player: state.player,
                            button: 'd',
                            isNesButton: true
                        });
                    }
                }
                if (state.axis1 == 0) {
                    state.axis1 = -1;
                    state.axis1Time = Date.now();
                    this.fireButtonDown({
                        player: state.player,
                        button: 'u',
                        isNesButton: true
                    });
                }
            }
            else if (pad.axes[1] > 0.5) {
                if (state.axis1) {
                    if (state.axis1 == -1) {
                        state.axis1 = 0;
                        this.fireButtonUp({
                            player: state.player,
                            button: 'u',
                            isNesButton: true
                        });
                    }
                    else if (state.axis1 == 1) {
                        if (Date.now() - state.axis1Time >= axisDelay) {
                            state.axis1 = 0;
                        }
                    }
                }
                if (state.axis1 == 0) {
                    state.axis1 = 1;
                    state.axis1Time = Date.now();
                    this.fireButtonDown({
                        player: state.player,
                        button: 'd',
                        isNesButton: true
                    });
                }
            }
            else if (state.axis1) {
                this.fireButtonUp({
                    player: state.player,
                    button: state.axis1 == -1 ? 'u' : 'd',
                    isNesButton: true
                });
                state.axis1 = 0;
            }
        }

        // 0 1 2 3
        pad.buttons.forEach((button, index) => {
            const value = gamepadMap[index];
            if (value) {
                if (button.pressed) {
                    if (!state.buttons[index]) {
                        state.buttons[index] = true;
                        this.fireButtonDown({
                            player: state.player,
                            button: value,
                            isNesButton: !value.startsWith('ls') && !value.startsWith('rs')
                        });
                    }
                }
                else {
                    if (state.buttons[index]) {
                        state.buttons[index] = false;
                        this.fireButtonUp({
                            player: state.player,
                            button: value,
                            isNesButton: !value.startsWith('ls') && !value.startsWith('rs')
                        });
                    }
                }
            }
        });
    }

    private getButtonEvent(event: KeyboardEvent): ButtonEvent {
        let button = this.configuration.buttonOfKey(event.keyCode);
        if (button) {
            return {
                player: 1,
                button: button,
                isNesButton: true
            }
        }
        else if (event.keyCode == 9) { // TAB
            return {
                player: 1,
                button: 'tab'
            }
        }
        else if (event.keyCode == 27) { // ESC
            return {
                player: 1,
                button: 'ls1'
            }
        }
        return null;
    }

    private fireButtonDown(buttonEvent: ButtonEvent): boolean {
        for (let i = this.keyDownCallbacks.length - 1; i >= 0; i -= 1) {
            let callback = this.keyDownCallbacks[i];
            if (callback(buttonEvent)) {
                return true;
            }
        }
        return false;
    }

    private fireButtonUp(buttonEvent: ButtonEvent): boolean {
        for (let i = this.keyUpCallbacks.length - 1; i >= 0; i -= 1) {
            let callback = this.keyUpCallbacks[i];
            if (callback(buttonEvent)) {
                return true;
            }
        }
        return false;
    }
}

type Callback = (event: ButtonEvent) => boolean

export enum ButtonEventType {
    buttonDown,
    buttonUp
}

export interface ButtonEvent {
    player: 1 | 2,
    button: GamepadButton,
    isNesButton?: boolean
}

class GamepadState {
    axis0: -1 | 0 | 1 = 0
    axis0Time = 0
    axis1: -1 | 0 | 1 = 0
    axis1Time = 0
    buttons: boolean[] = [
        false,
        false,
        false,
        false,
        false,
        false,

        false,
        false,
        false,
        false,
        false,
        false,

        false,
        false,
        false,
        false,
        false,
        false,

        false
    ];

    constructor(public player: 1|2) {
    }
}

const gamepadMap: { [button: number]: GamepadButton } = {
    0: 'B',
    1: 'a',
    2: 'b',
    3: 'A',
    4: 'ls1',
    5: 'rs1',
    8: 'select',
    9: 'start'
}