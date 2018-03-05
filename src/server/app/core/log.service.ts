import * as winston from 'winston';
import * as moment from 'moment-timezone';
import Configuration from './configuration';

export default class LogService {

    private logger: winston.LoggerInstance;

    static readonly $inject = ['configuration'];
    constructor(private configuration: Configuration) {
        if (configuration.log) {
            this.logger = new winston.Logger({
                transports: [
                    new (winston.transports.File)({
                        filename: configuration.log,
                        handleExceptions: true,
                        json: false,
                        timestamp: this.time.bind(this)
                    })
                ]
            });
        }
        else {
            this.logger = (winston as any) as winston.LoggerInstance;
        }
    }

    private time(m: moment.Moment): string {
        m = m || moment();
        if (this.configuration.logTZ) {
            let m2 = m.tz(this.configuration.logTZ);
            if (m2.isValid) {
                m = m2;
            }
        }
        return m.format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
    }

    info(msg: string, meta?: any) {
        this.logger.info(msg, meta);
    }

    warn(msg: string, meta?: any) {
        this.logger.warn(msg, meta);
    }

    error(msg: string, meta?: any) {
        this.logger.error(msg, meta);
    }
}
