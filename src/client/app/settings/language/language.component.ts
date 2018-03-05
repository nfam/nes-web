import { Component, Output, EventEmitter, Input, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonEvent, GamepadService, ButtonEventType } from '../../core/gamepad.service';
import { Unsubscribable } from '../../core/unsubscribable';
import { Configuration } from '../../core/configuration';

@Component({
    templateUrl: 'language.component.html'
})
export class LanguageComponent implements OnInit, OnDestroy {
    private subscriptions: Unsubscribable[] = [];

    get lang(): string {
        return this.configuration.lang || 'en';
    }

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

    click(lang: string) {
        this.configuration.lang = lang;
        this.router.navigateByUrl('/settings');
    }

    buttonDown(event: ButtonEvent): boolean {
        switch (event.button) {
        case 'tab':
            this.configuration.lang = this.lang == 'en' ? 'vi' : 'en';
            return true;
        case 'ls1':
            this.router.navigateByUrl('/settings');
            return true;
        case 'l':
        case 'u':
            this.configuration.lang = 'en';
            return true;
        case 'r':
        case 'd':
            this.configuration.lang = 'vi';
            return true;
        case 'select':
            this.configuration.lang = this.lang == 'en' ? 'vi' : 'en';
            return true;
        case 'start':
            this.router.navigateByUrl('/settings');
            return true;
        }
        return false;
    }
}
