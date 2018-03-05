import { Component, Input, Inject } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';

import { Game } from '../../game.model';

@Component({
    selector: 'game-cover',
    templateUrl: 'game-cover.component.html'
})
export class GameCardComponent {
    @Input()
    game: Game;

    @Input()
    number: number;

    @Input()
    selected: boolean;

    constructor(@Inject(APP_BASE_HREF) private baseHref: string) {
        if (this.baseHref.endsWith('/')) {
            this.baseHref = this.baseHref.substring(0, this.baseHref.length - 1);
        }
    }
}
