import { Injectable, EventEmitter } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Emulator, Speaker, Output, ControllerButton } from 'tsnes';

import { Configuration } from '../core/configuration';
import { Socket } from './socket';
import { GamepadService } from './gamepad.service';

export enum PlayingStatus {
    waiting = 1,
    ready,
    running,
    paused,
    error
}

const interval = 50;

@Injectable()
export class PlayingService {

    private emulator: Emulator;
    speaker: Speaker;
    private animationRequestId: number;
    private intervalId: number;

    private _name = new BehaviorSubject<string>(null);
    private _status = new BehaviorSubject<PlayingStatus>(null);
    private _coverImage = new BehaviorSubject<HTMLImageElement>(null);
    private _output = new BehaviorSubject<Output>(null);

    constructor(
        private configuration: Configuration,
        private gamepadService: GamepadService
    ) {
        this.emulator = new Emulator();
        this.speaker = new Speaker();
        this.emulator.onsample = this.speaker.push.bind(this.speaker);
        this.emulator.onerror = error => this._status.next(PlayingStatus.error);
        this.speaker.onbufferunderrun = () => this.emulator.frame();
        this.startTimer();
    }

    get name(): Observable<string> {
        return this._name;
    }
    get status(): Observable<PlayingStatus> {
        return this._status;
    }
    get statusValue(): PlayingStatus {
        return this._status.getValue();
    }

    get coverImage(): Observable<HTMLImageElement> {
        return this._coverImage;
    }
    get output(): Observable<Output> {
        return this._output;
    }

    load(name: string, rom: ArrayBuffer) {
        this.emulator.load(rom);
        this._name.next(name);
        this._status.next(PlayingStatus.ready);
        this._coverImage.next(null);
        this._output.next(null);
        this.configuration.playing = name;

        var img = new Image();
        img.onload = () => {
            if (this._name.getValue() == name && img.complete && img.naturalHeight !== 0) {
                this._coverImage.next(img);
            }
        };
        img.src = window.location.protocol+'//'+window.location.host+'/screen/'+name+'.png';
    }

    start() {
        if (this._status.getValue() != PlayingStatus.ready) return;
        this.requestAnimation();
        this._status.next(PlayingStatus.running);
    }

    pause() {
        if (this._status.getValue() != PlayingStatus.running) return;
        this.speaker.close();
        this.cancelAnimation();
        this._status.next(PlayingStatus.paused);
    }

    resume() {
        if (this._status.getValue() != PlayingStatus.paused) return;
        this.requestAnimation();
        this._status.next(PlayingStatus.running);
    }

    stop() {
        let status = this._status.getValue();
        if (status != PlayingStatus.running && status != PlayingStatus.paused) return;
        this.speaker.close();
        this.cancelAnimation();
        this._status.next(PlayingStatus.ready);
        this._output.next(null);
    }

    buttonDown(player: 1|2, button: ControllerButton) {
         this.emulator.buttonDown(player, button);
    }

    buttonUp(player: 1|2, button: ControllerButton) {
        this.emulator.buttonUp(player, button);
    }

    private startTimer() {
        if (!this.intervalId) {
            this.intervalId = window.setInterval(this.gamepadService.frame.bind(this.gamepadService), interval);
        }
    }

    private stopTimer() {
        if (this.intervalId) {
            window.clearInterval(this.intervalId);
            this.intervalId = 0;
        }
    }

    private requestAnimation() {
        this.animationRequestId = window.requestAnimationFrame(this.onAnimation.bind(this));
        this.stopTimer();
    }

    private cancelAnimation() {
        if (this.animationRequestId) {
            window.cancelAnimationFrame(this.animationRequestId);
            this.animationRequestId = 0;
        }
        this.startTimer();
    }

    private onAnimation() {
        this.gamepadService.frame();
        if (this._status.getValue() == PlayingStatus.running) {
            this.requestAnimation();
            if (this.emulator.frame()) {
                this._output.next(this.emulator.pull());
            }
            else {
                this._status.next(PlayingStatus.error);
            }
        }
    }
}
