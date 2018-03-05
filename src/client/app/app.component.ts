import { Component, Inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { GamepadService, ButtonEventType, ButtonEvent } from './core/gamepad.service';
import { FullscreenService } from './core/fullscreen.service';
import { Unsubscribable } from './core/unsubscribable';

@Component({
    selector: 'app',
    templateUrl: 'app.component.html',
    host: {
        '(document:keydown)': 'keyDown($event)',
        '(document:keyup)': 'keyUp($event)'
    }
})
export class AppComponent {

    name = 'NES';

    constructor(
        private router: Router,
        private fullscreenService: FullscreenService,
        private gamepadService: GamepadService
    ) {
    }

    keyDown(event: KeyboardEvent) {
        if (this.gamepadService.keyDown(event)) {
            event.preventDefault();
        }
    }

    keyUp(event: KeyboardEvent) {
        if (this.gamepadService.keyUp(event)) {
            event.preventDefault();
        }
    }

    get fullscreenSupported(): boolean {
        return this.fullscreenService.supported;
    }

    get fullscreened(): boolean {
        return this.fullscreenService.fullscreened;
    }

    toggleFullscreen() {
        let html = document.getElementsByTagName('html');
        if (html && html.length == 1) {
            this.fullscreenService.toggle(html[0]);
        }
    }
}
