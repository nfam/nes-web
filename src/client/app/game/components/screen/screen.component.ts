import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy, OnInit } from '@angular/core';

import { Configuration } from '../../../core/configuration';
import { PlayingService, PlayingStatus } from '../../../core/playing.service';
import { RoomService } from '../../../room/room.service';
import { Unsubscribable } from '../../../core/unsubscribable';
import { GamepadService, ButtonEventType, ButtonEvent } from '../../../core/gamepad.service';
import { ControllerButton } from 'tsnes';

@Component({
    selector: 'screen',
    templateUrl: 'screen.component.html',
    styleUrls: ['screen.component.css'],
    host: {
        '(document:keypress)': 'keyPress($event)',
        '(window:resize)': 'layout($event)'
    },
})

export class ScreenComponent implements OnInit, AfterViewInit, OnDestroy {
    private subscriptions: Unsubscribable[] = [];

    @Input() name: string
    @Input() mode: 'master'|'mirror'

    @ViewChild('canvas') canvas: ElementRef;
    private context: CanvasRenderingContext2D;
    private imageData: ImageData;

    private status: PlayingStatus = null;
    private coverImage: HTMLImageElement = null;
    private frame: number[] = null;

    constructor(
        private configuration: Configuration,
        private playingService: PlayingService,
        private gamepadService: GamepadService,
        private roomService: RoomService
    ) {
    }

    ngOnInit() {
        this.subscriptions.push(
            this.gamepadService.on(ButtonEventType.buttonDown, this.buttonDown.bind(this))
        );
        this.subscriptions.push(
            this.gamepadService.on(ButtonEventType.buttonUp, this.buttonUp.bind(this))
        );
    }

    ngAfterViewInit(): void {
        this.context = this.canvas.nativeElement.getContext('2d');
        this.imageData = this.context.getImageData(0, 0, 256, 240);
        this.context.fillStyle = 'black';
        this.context.fillRect(0, 0, 256, 240);
        for (let i = 3; i < this.imageData.data.length - 3; i += 4) {
            this.imageData.data[i] = 0xFF; // alpha
        }
        this.subscriptions.push(
            this.playingService.coverImage.subscribe(image => {
                if (this.coverImage !== image) {
                    this.coverImage = image;
                    this.draw();
                }
            })
        );
        if (this.mode == 'master') {
            this.subscriptions.push(
                this.playingService.status.subscribe(status => {
                    if (this.status != status) {
                        this.status = status;
                        this.draw();
                    }
                })
            );
            this.subscriptions.push(
                this.playingService.output.subscribe(output => {
                    this.frame = output ? output.video : null;
                    this.draw();
                })
            );
        }
        else if (this.mode == 'mirror') {
            this.subscriptions.push(
                this.roomService.mirrorStatus.subscribe(status => {
                    if (this.status != status) {
                        this.status = status;
                        this.draw();
                    }
                })
            );
            this.subscriptions.push(
                this.roomService.mirrorOutput.subscribe(output => {
                    this.frame = output ? output.video : null;
                    this.draw();
                    if (output && output.audio) {
                        this.playingService.speaker.play(output.audio);
                    }
                })
            );
        }
        this.draw();
        this.layout();
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    clickScreen() {
        if (this.mode == 'master') {
            switch (this.status) {
            case PlayingStatus.ready:
                this.playingService.start();
                break;
            case PlayingStatus.running:
                this.playingService.pause();
                break;
            case PlayingStatus.paused:
                this.playingService.resume();
                break;
            }
        }
        else if (this.mode == 'mirror') {
            switch (this.status) {
            case PlayingStatus.running:
                this.roomService.sendRequest('pause');
                break;
            case PlayingStatus.paused:
                this.roomService.sendRequest('resume');
                break;
            }
        }
    }

    buttonDown(event: ButtonEvent): boolean {
        if (this.status == PlayingStatus.running) {
            if (event.isNesButton) {
                if (this.mode == 'master') {
                    this.playingService.buttonDown(event.player, event.button as ControllerButton);
                }
                else if (this.mode == 'mirror') {
                    this.roomService.sendButtonDown(event.button as ControllerButton);
                }
                return true;
            }
        }
        else if (event.button == 'start') {
            if (this.status == PlayingStatus.ready) {
                if (this.mode == 'master') {
                    this.playingService.start();
                    return true;
                }
            }
            else if (this.status == PlayingStatus.paused) {
                if (this.mode == 'master') {
                    this.playingService.resume();
                }
                else if (this.mode == 'mirror') {
                    this.roomService.sendRequest('resume');
                }
                return true;
            }
        }
        return false;
    }

    buttonUp(event: ButtonEvent): boolean {
        if (event.isNesButton) {
            if (this.mode == 'master') {
                this.playingService.buttonUp(event.player, event.button as ControllerButton);
            }
            else if (this.mode == 'mirror') {
                this.roomService.sendButtonUp(event.button as ControllerButton);
            }
            return true;
        }
        return false;
    }

    keyPress(event: KeyboardEvent) {
        if (this.status != PlayingStatus.running) return;
        event.preventDefault();
    }

    layout() {
        let canvas = this.canvas.nativeElement;

        var w = window,
            d = document,
            e = d.documentElement,
            g = d.getElementsByTagName('body')[0],
            width = w.innerWidth || e.clientWidth || g.clientWidth,
            height = w.innerHeight|| e.clientHeight|| g.clientHeight;

        let parentRatio = width / height;
        let desiredRatio = 256 / 240;
        canvas.style.zoom = (desiredRatio < parentRatio) ? (height - 20) / 240 : (width - 20) / 256;
    }

    private draw() {
        switch (this.status) {
        case PlayingStatus.waiting:
            this.drawText('⌛', 'DarkOrange');
            break;
        case PlayingStatus.ready:
            this.drawText(this.mode == 'mirror' ? '⌛' : '▶', 'Green');
            break;
        case PlayingStatus.running:
            this.drawBackground();
            break;
        case PlayingStatus.paused:
            this.drawText('||', 'DarkOrange');
            break;
        case PlayingStatus.error:
            this.drawText('!', 'DarkRed');
            break;
        }
    }

    private drawBackground() {
        if (!this.context) return;
        if (this.frame) {
            let data = this.imageData.data;
            let buffer: number[] = this.frame;
            for (let i = 0; i < 256 * 240; i += 1) {
                let pixel = buffer[i];
                let j = i * 4;
                data[j] = pixel & 0xFF;
                data[j + 1] = (pixel >> 8) & 0xFF;
                data[j + 2] = (pixel >> 16) & 0xFF;
            }
            this.context.putImageData(this.imageData, 0, 0);
        }
        else if (this.coverImage) {
            this.context.drawImage(this.coverImage, 0, 0);
        }
        else {
            this.context.fillStyle = 'black';
            this.context.fillRect(0, 0, 256, 240);
        }
    }

    private drawText(text: string, color: string) {
        if (!this.context) return;
        this.drawBackground();

        this.context.beginPath();
        this.context.rect(0, 0, 256, 240);
        this.context.fillStyle = 'rgba(0,0,0,0.5)';
        this.context.fill();
        this.context.closePath();

        /*this.context.beginPath();
        this.context.ellipse(128, 120, 25, 25, 0, 0, 2 * Math.PI);
        this.context.fillStyle = 'LightGray';
        this.context.fill();
        this.context.closePath();*/

        this.context.font = '30px Verdana';
        this.context.fillStyle = color;
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';
        this.context.fillText(text, 128, 120);
    }
}
