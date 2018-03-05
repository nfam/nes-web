import * as fs from "fs";
import LogService from "../core/log.service";
import { Game } from "./game.model";

export default class GameService {
    games: Game[] = [];

    static $inject = [
        'logService'
    ];
    constructor(
        private logService: LogService
    ) {
    }

    scan(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const dataDir = __dirname + "/../../../data";
            fs.readdir(dataDir + "/roms", (error, files) => {
                if (error) {
                    reject(error);
                    return
                }
                let names: string[] = [];
                for (let file of files) {
                    if (file.endsWith(".nes")) {
                        names.push(file.substring(0, file.length - 4).trim());
                    }
                }
                if (names.length == 0) {
                    resolve();
                    return;
                }
                fs.readFile(dataDir + "/roms/singleplayer.txt", "utf8", (error, content) => {
                    let mog: string[] = error ? [] : content.split('\n').map(name => name.trim());
                    names.sort().forEach(name => {
                        this.games.push({
                            name: name,
                            multiplayer: mog.indexOf(name) < 0
                        });
                    });
                    this.logService.info("Games:\n" + description(this.games))
                    resolve();
                });
            });
        });
    }
}

function description(games: Game[]): string {
    return "" +
        "+-------------+-------------------\r\n" +
        "| Multiplayer | Title             \r\n" +
        "+-------------+-------------------\r\n" +
    games.map(game => {
        return (game.multiplayer ?
        "|      *      | " :
        "|             | ") + game.name;
    }).join("\r\n") +
        "\r\n+-------------+-------------------\r\n";
}