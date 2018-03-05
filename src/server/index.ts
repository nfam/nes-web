import * as nconf from 'nconf';
import * as fs from 'fs';
import Injection from 'sinjection';

import Configuration        from './app/core/configuration';
import LogService           from './app/core/log.service';
import GameService          from './app/game/game.service';
import GameController       from './app/game/game.controller';
import ServerHelper         from './app/core/server.helper';
import Server               from './app/server';
import RoomService          from './app/room/room.service';
import SocketController     from './app/socket/socket.controller';

nconf.env().argv().defaults({
    client: JSON.parse(fs.readFileSync(__dirname+'/config/client.json', 'utf8')),
    database: JSON.parse(fs.readFileSync(__dirname+'/config/database.json', 'utf8')),
    port: 8080
});

var injection = new Injection();

injection.set('configuration', Configuration);
injection.set('gameController', GameController);
injection.set('gameService', GameService);
injection.set('logService', LogService);
injection.set('roomService', RoomService);
injection.set('socketController', SocketController);
injection.set('serverHelper', ServerHelper);
injection.set('server', Server);

injection.build();
process.title = 'nes';

injection.get<LogService>('logService').info('Timezone :'+injection.get<Configuration>('configuration').logTZ);

injection.get<GameService>('gameService').scan()
.then(() => injection.get<Server>('server').listen())
.catch((error: Error) => {
    console.log(error);
});
