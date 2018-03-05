import * as Express from "express";
import GameService from "./game.service";
import LogService from "../core/log.service";

export default class GameController {
    static $inject = [
        'logService',
        'gameService'
    ];

    constructor(
        private logService: LogService,
        private gameService: GameService
    ) {
    }

    router(): Express.RequestHandler {
        var router = Express.Router();
        router.get("/", (req, res) => {
            res.header["content-type"] = "application/json";
            res.end(JSON.stringify(this.gameService.games));
        });
        return router;
    }
}