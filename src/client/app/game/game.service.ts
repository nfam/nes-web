import { Injectable, Inject } from "@angular/core";
import { Http, ResponseContentType } from '@angular/http';
import { Game } from './game.model';

@Injectable()
export class GameService {
    private games: Game[];

    constructor(@Inject(Http) private http: Http) {
    }

    getGames(): Promise<Game[]> {
        if (!this.games) {
            return this.http.request('/api/games/')
            .toPromise()
            .then(res => {
                this.games = res.json() as Game[];
                return this.games
            });
        }
        else {
            return Promise.resolve(this.games);
        }
    }

    getGame(name: string): Promise<Game> {
        if (!this.games) {
            return this.http.request('/api/games/')
            .toPromise()
            .then((res): Game => {
                this.games = res.json() as Game[];
                if (this.games) {
                    for (let i = 0; i < this.games.length; i += 1) {
                        let game = this.games[i];
                        if (game.name == name) {
                            return game;
                        }
                    }
                }
                 throw new Error('Game "'+name+'" is not available.');
            });
        }
        else {
            for (let i = 0; i < this.games.length; i += 1) {
                let game = this.games[i];
                if (game.name == name) {
                    return Promise.resolve(game);
                }
            }
            return Promise.reject(new Error('Game "'+name+'" is not available.'))
        }
    }

    getRom(name: string): Promise<ArrayBuffer> {
        return this.http.get('roms/'+name+'.nes', { responseType: ResponseContentType.ArrayBuffer })
        .toPromise()
        .then(res => res.arrayBuffer());
    }
}