import * as nconf from 'nconf';

export default class Configuration {

    constructor() {
    }

    get database(): {[name : string] : any} {
        return nconf.get('database');
    }

    get client(): {[name : string] : any} {
        return nconf.get('client');
    }

    get port(): string {
        return nconf.get('port');
    }

    get log(): string {
        return nconf.get('log');
    }

    get logTZ(): string {
        return nconf.get('logTZ');
    }
}