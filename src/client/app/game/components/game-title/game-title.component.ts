import { Component, Input } from '@angular/core';
import { Game } from '../../game.model';

@Component({
    selector: 'game-title',
    templateUrl: 'game-title.component.html',
})
export class GameTitleComponent {
    @Input() game: Game
}
