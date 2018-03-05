import { Component, Output, EventEmitter, Input, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonEvent, GamepadService, ButtonEventType } from '../core/gamepad.service';
import { Unsubscribable } from '../core/unsubscribable';

@Component({
    templateUrl: 'settings.component.html'
})
export class SettingsComponent implements OnInit, OnDestroy {
    private subscriptions: Unsubscribable[] = [];

    Option = Option;
    option = Option.controller;

    constructor(
        private router: Router,
        private gamepadService: GamepadService) {
    }

    ngOnInit() {
        this.subscriptions.push(
            this.gamepadService.on(ButtonEventType.buttonDown, this.buttonDown.bind(this))
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    buttonDown(event: ButtonEvent): boolean {
        switch (event.button) {
        case 'tab':
            this.option = this.option == Option.language ? Option.controller : Option.language;
            return true;
        case 'ls1':
            this.router.navigateByUrl('/');
            return true;
        case 'l':
        case 'u':
            this.option = Option.controller;
            return true;
        case 'r':
        case 'd':
            this.option = Option.language;
            return true;
        case 'start':
            switch (this.option) {
            case Option.controller:
                this.router.navigateByUrl('/settings/controller');
                break;
            case Option.language:
                this.router.navigateByUrl('/settings/language');
                break;
            }
            return true;
        }
        return false;
    }
}

enum Option {
    controller,
    language
}