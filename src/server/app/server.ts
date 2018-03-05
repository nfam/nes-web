import * as Express from 'express';
import * as WS from 'ws';
var expressWS = require('express-ws');
var bodyParser = require('body-parser');
import * as fs from 'fs';
import * as http from 'http';

import Configuration from './core/configuration';
import LogService from './core/log.service';
import { relative } from 'path';
import SocketController from './socket/socket.controller';
import GameController from './game/game.controller';

export interface ExpressWebSocket {
    readonly app: Express.Application
    getWss(): WS.Server
    applyTo(router: Express.Router): void
}

export default class Server {

    public readonly app: Express.Application;
    public readonly httpServer: http.Server;
    public readonly ws: ExpressWebSocket;

    static $inject = [
        'configuration',
        'logService',
        'gameController',
        'socketController'
    ];
    constructor(
        private configuration: Configuration,
        private logService: LogService,
        gameController: GameController,
        socketController: SocketController
    ) {
        this.app = Express();
        this.httpServer = http.createServer(this.app);
        this.ws = expressWS(this.app, this.httpServer);

        this.app.use('/', Express.static(__dirname+'/../../client/'));
        this.app.use('/api/games', gameController.router());
        this.app.use('/roms/', Express.static(__dirname+'/../../data/roms/'));
        this.app.use('/screen/', Express.static(__dirname+'/../../data/screen/'));
        this.app.use(bodyParser.json());
        this.app.use('/.socket', socketController.router());
        this.app.get('/settings', this.index('./'));
        this.app.get('/settings/', this.index('../'));
        this.app.get('/settings/controller', this.index('../'));
        this.app.get('/settings/controller/', this.index('../../'));
        this.app.get('/settings/language', this.index('../'));
        this.app.get('/settings/language/', this.index('../../'));
        this.app.get('/:game', this.index('./'));
        this.app.get('/:game', this.index('./'));
        this.app.get('/:game/', this.index('../'));
    }

    private indexHtml: { [relativeTo: string]: string } = {}
    index(relativeTo: string): Express.RequestHandler {
        return (req, res, next) => {
            let content = this.indexHtml[relativeTo];
            if (!content) {
                content = this.indexHtml['./'];
                if (!content) {
                    content = fs.readFileSync(__dirname+'/../../client/index.html', 'utf8');
                    this.indexHtml['./'] = content;
                }
                if (relativeTo != './') {
                    content = content.replace('manifest="app.manifest"', `manifest="${relativeTo}app.manifest"`);
                    content = content.split('href="assets').join(`href="${relativeTo}assets`);
                    content = content.split('href="cdn').join(`href="${relativeTo}cdn`);
                    content = content.split('src="assets').join(`src="${relativeTo}assets`);
                    content = content.split('src="cdn').join(`src="${relativeTo}cdn`);
                    content = content.replace('"cdn/":"cdn/"', `"cdn/": "${relativeTo}cdn/"`);
                    this.indexHtml[relativeTo] = content;
                }
            }
            res.setHeader('content-type', 'text/html');
            res.send(content);
        }
    }

    listen(): Promise<any> {
        this.logService.info('listen on '+this.configuration.port);
        if (this.httpServer.listening) {
            return Promise.resolve();
        }
        else {
            return new Promise<void>((resolve, reject) => {
                this.httpServer.listen(this.configuration.port, (error: Error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve();
                    }
                });
            });
        }
    }
}
