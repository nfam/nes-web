import { Component, Input, OnInit, OnDestroy, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import { Game } from './game.model';
import { GameService } from './game.service';
import { Configuration } from '../core/configuration';
import { PlayingService } from '../core/playing.service';
import { GamepadService, ButtonEventType, ButtonEvent } from '../core/gamepad.service';
import { Unsubscribable } from '../core/unsubscribable';

@Component({
    templateUrl: 'game-list.component.html',
})
export class GameListComponent implements OnInit, OnDestroy, AfterViewChecked {
    private subscriptions: Unsubscribable[] = [];

    games: Game[] = null;
    selectedIndex: number = null;
    private movedToSelected = false;

    constructor(
        private router: Router,
        private configuration: Configuration,
        private gamepadService: GamepadService,
        private gameService: GameService,
        private playingService: PlayingService
    ) {
        gameService.getGames()
        .then(games => {
            this.games = games;
            if (this.selectedIndex === null) {
                if (this.configuration.playing) {
                    for (let i = 0; i < games.length; i += 1) {
                        if (games[i].name == this.configuration.playing) {
                            this.selectedIndex = i;
                            break;
                        }
                    }
                }
                else {
                    this.selectedIndex = 0;
                }
            }
            if (this.selectedIndex > this.games.length - 1) {
                this.selectedIndex = this.games.length - 1;
            }
        });
    }

    ngOnInit() {
        this.subscriptions.push(
            this.gamepadService.on(ButtonEventType.buttonDown, this.buttonDown.bind(this))
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    ngAfterViewChecked() {
        if (!this.movedToSelected && this.selectedIndex) {
            this.movedToSelected = true;
            this.moveToViewIfRequired();
        }
    }

    buttonDown(event: ButtonEvent): boolean {
        switch (event.button) {
        case 'tab':
            if (this.games) {
                if (this.selectedIndex < this.games.length - 1) {
                    this.selectedIndex += 1;
                }
                else {
                    this.selectedIndex = 0;
                }
                this.moveToViewIfRequired();
                return true;
            }
            return false;
        case 'ls1':
            this.router.navigateByUrl('/settings');
            return true;
        case 'l':
            if (this.selectedIndex > 0) {
                this.selectedIndex -= 1;
                this.moveToViewIfRequired();
                return true;
            }
            break;
        case 'r':
            if (this.games && this.selectedIndex < this.games.length - 1) {
                this.selectedIndex += 1;
                this.moveToViewIfRequired();
                return true;
            }
            break;
        case 'u':
            if (this.selectedIndex > 0) {
                this.selectedIndex -= this.getCellsPerRow();
                if (this.selectedIndex < 0) {
                    this.selectedIndex = 0;
                }
                this.moveToViewIfRequired();
                return true;
            }
            break;
        case 'd':
            if (this.games && this.selectedIndex < this.games.length - 1) {
                this.selectedIndex += this.getCellsPerRow();
                if (this.selectedIndex > this.games.length - 1) {
                    this.selectedIndex = this.games.length - 1;
                }
                this.moveToViewIfRequired();
                return true;
            }
            break;
        case 'start':
            if (this.games && this.selectedIndex < this.games.length - 1) {
                let game = this.games[this.selectedIndex];
                this.router.navigateByUrl('/'+encodeURIComponent(game.name));
                return true;
            }
            break;
        }
        return false;
    }

    private moveToViewIfRequired() {
        var e = document.getElementById('cover-'+this.selectedIndex);
        if (!e) return;
        var rect = e.getBoundingClientRect();
        var visible = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
            rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
        );
        if (!visible) {
            if (this.selectedIndex < this.getCellsPerRow()) {
                document.body.scrollTop = 0;
                document.documentElement.scrollTop = 0;
            }
            else {
                e.scrollIntoView();
            }
        }
    }

    private getCellsPerRow(): number {
        if (!this.games || !this.games.length) return 0;
        let top = document.getElementById('cover-0').getBoundingClientRect().top;

        let count = 1;
        for (let i = 1; i < this.games.length; i += 1) {
            var e = document.getElementById('cover-'+i);
            if (e.getBoundingClientRect().top > top) {
                return i;
            }
        }
        return count;
    }
}
