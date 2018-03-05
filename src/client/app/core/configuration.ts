import { Injectable } from '@angular/core';
import { ControllerButton } from 'tsnes';

interface MirrorRoom {
    game: string,
    id: string
}

@Injectable()
export class Configuration {

    set lang(value: string) {
        if (this._lang !== value) {
           this._lang = value;
           this.save();
       }
    }
    get lang(): string {
       return this._lang;
    }
    private _lang: string;

    set username(value: string) {
         if (this._username !== value) {
            this._username = value;
            this.save();
        }
    }
    get username(): string {
        return this._username;
    }
    private _username: string;

    set playing(value: string) {
         if (this._playing !== value) {
            this._playing = value;
            this.save();
        }
    }
    get playing(): string {
        return this._playing;
    }
    private _playing: string;

    set mirrorRoom(value: MirrorRoom) {
        if (value) {
            if (!this._mirrorRoom ||
                this._mirrorRoom.game != value.game ||
                this._mirrorRoom.id != value.id
            ) {
                this._mirrorRoom = {
                    game: value.game,
                    id: value.id
                };
                this.save();
            }
        }
        else if (this._mirrorRoom) {
            this._mirrorRoom = null;
            this.save();
        }
    }
    get mirrorRoom(): MirrorRoom {
        return this._mirrorRoom;
    }
    private _mirrorRoom: MirrorRoom;

    private keyboardMap: { [ControllerButton: string]:  number};
    get keyboardMapModified(): boolean {
        for (let button in this.keyboardMap) {
            if (this.keyboardMap[button] !== defaultKeyboardMap[button]) {
                return true;
            }
        }
        return false;
    }

    constructor() {
        this._username = '';
        this._playing = '';
        this.keyboardMap = {};
        this.setDefaultKeyboardMap();
        this.load();
    }

    keyOfButton(button: ControllerButton): number {
        return this.keyboardMap[button];
    }

    buttonOfKey(keyboardKey: number): ControllerButton {
        for (let button in this.keyboardMap) {
            if (keyboardKey === this.keyboardMap[button]) {
                return button as ControllerButton;
            }
        }
        return undefined;
    }

    setKeyboardMap(button: ControllerButton, keyboardKey: number) {
        if (this.keyboardMap[button] !== undefined &&
            this.keyboardMap[button] !== keyboardKey
        ) {
            this.keyboardMap[button] = keyboardKey;
            this.save();
        }
    }

    resetKeyboardMap() {
        this.setDefaultKeyboardMap();
        this.save();
    }

    private setDefaultKeyboardMap() {
        Object.keys(defaultKeyboardMap).forEach(button => {
            this.keyboardMap[button] = defaultKeyboardMap[button];
        });
    }

    private load() {
        if (localStorage && typeof localStorage.getItem === 'function') {
            let settingsText = localStorage.getItem('settings');
            try {
                let settings = JSON.parse(settingsText);
                if (typeof settings.lang === 'string') {
                    this._lang = settings.lang;
                }
                if (typeof settings.username === 'string') {
                    this._username = settings.username;
                }
                if (typeof settings.playing === 'string') {
                    this._playing = settings.playing;
                }
                if (settings.mirrorRoom &&
                    typeof settings.mirrorRoom.game === 'string' &&
                    typeof settings.mirrorRoom.id === 'string') {
                    this._mirrorRoom = settings.mirrorRoom;
                }
                if (typeof settings.keyboardMap === 'object') {
                    Object.keys(this.keyboardMap).forEach(button => {
                        let value = settings.keyboardMap[button];
                        if (typeof value === 'number') {
                            this.keyboardMap[button] = value;
                        }
                    });
                }
            }
            catch (e) { }
        }
    }

    private save() {
        if (localStorage && typeof localStorage.setItem === 'function') {
            try {
                localStorage.setItem('settings', JSON.stringify({
                    lang: this.lang,
                    username: this.username,
                    playing: this.playing,
                    keyboardMap: this.keyboardMap,
                    mirrorRoom: this.mirrorRoom
                }));
            }
            catch (e) { }
        }
    }
}

const defaultKeyboardMap: { [button: string]:  number} = {};
defaultKeyboardMap.a = 88;      // X
defaultKeyboardMap.b = 90;      // Z
defaultKeyboardMap.select = 16; // Right Shift
defaultKeyboardMap.start = 13;  // Enter
defaultKeyboardMap.u = 38;      // Up
defaultKeyboardMap.d = 40;      // Down
defaultKeyboardMap.l = 37;      // Left
defaultKeyboardMap.r = 39;      // Right
defaultKeyboardMap.A = 83;      // S
defaultKeyboardMap.B = 65;      // A