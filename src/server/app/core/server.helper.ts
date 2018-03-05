import * as Express from 'express';
import * as http from 'http';

export default class ServerHelper {
    getParam(req: Express.Request, name: string, type: string) {
        if (req.body && req.body[name] !== undefined) {
            let value = req.body[name];
            if (type) {
                let types = type.split('|').map(type => type.trim());
                for (let i = 0; i < types.length; i++) {
                    let type = types[i].trim();
                    if (value === null && type === 'null') {
                        return value;
                    }
                    else if (typeof value === type) {
                        return value;
                    }
                    else if (type === 'int' && typeof value === 'number') {
                        if (value == parseInt(value.toFixed(0))) {
                            return value;
                        }
                    }
                }
            }
            else {
                return value;
            }
        }
        else if (req.query[name] !== undefined) {
            let value = req.query[name];
            if (type) {
                let types = type.split('|');
                let parsed = false;
                for (let i = 0; i < types.length; i += 1) {
                    let type = types[i].trim();
                    if (type == 'boolean') {
                        if (value == 'true') {
                            return true;
                        }
                        else if (value == 'false') {
                            return false;
                        }
                    }
                    else if (type == 'int') {
                        let int = parseInt(value);
                        if (!isNaN(int) && int.toString() == value) {
                            return int;
                        }
                    }
                    else if (type == 'null') {
                        if (value == 'null') {
                            return null;
                        }
                    }
                    else if (type == 'string') {
                        return value;
                    }
                }
                return undefined;
            }
            return value;
        }
        return undefined;
    }

    filter(items: any[], query: { [name: string]: string }): any[] {
        for (let name in query) {
            let value = query.value;
            items = items.filter(item => {
                if (item.hasOwnProperty(name)) {
                    if (item[name].toString() == value) {
                        return true;
                    }
                }
                return false;
            });
        }
        return items;
    }
    
    sendJSON(res: http.ServerResponse, json: any, httpStatus?: number) {
        if (httpStatus) {
            (res as any).status(httpStatus);
        }
        res.setHeader('content-type', 'application/json');
        return res.end(JSON.stringify(json));
    }    
}
