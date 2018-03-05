import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'overlay-player',
    templateUrl: 'overlay-player.component.html'
})
export class OverlayPlayerComponent {
    @Input() asmaster: boolean
    @Input() username: string
}