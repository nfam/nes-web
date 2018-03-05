import * as pako from 'pako';
import * as xson from 'xson.js';

export type SocketStatus = 'connected'|'connecting'|'closed';


export class Socket {

    private status: SocketStatus;
    constructor(private url: string, options: { connect?: boolean, tickingSeconds?: number } = {}) {
        this.status = 'closed';
        if (options.connect) {
            this.connect();
        }
        if (options.tickingSeconds && options.tickingSeconds > 0) {
            let duration = options.tickingSeconds * 1000;
            let tick = () => {
                if (this._socket && this.status == 'connected') {
                    this.send('tick');
                }
                setTimeout(tick, duration);
            };
            tick();
        }
    }

    send(data: any) {
        this._socket.send(Socket.serialize(data));
    }

    connect(params: { [name: string]: string } = {}): boolean {
        if (this.status == 'closed') {
            this.status = 'connecting';
            let url = this.url;
            Object.keys(params).forEach(name => {
                url += (url.indexOf('?') > 0) ? '&' : '?';
                url += name + '=' + params[name];
            });
            let socket = new WebSocket(url);
            socket.binaryType = 'arraybuffer';
            this.socket = socket;
            return true;
        }
        else {
            return false;
        }
    }

    close() {
        if (this.status != 'closed') {
            this.status = 'closed';
            this._socket.onclose = () => {};
            this._socket.close();
        }
    }

    private _socket: WebSocket = null;
    private set socket(socket: WebSocket) {
        this._socket = socket;
        if (this._socket) {
            if (this._onopen) this._socket.onopen = this._onopen;
            if (this._onmessage) this._socket.onmessage = this._onmessage;
            if (this._onerror) this._socket.onerror = this._onerror;
            if (this._onclose) this._socket.onclose = this._onclose;
        }
    }

    private _onopen: (event: Event) => void = null;
    set onopen(callback: (event: Event) => void) {
        this._onopen = (event: Event) => {
            this.status = 'connected';
            if (callback) {
                callback(event);
            }
        };
        if (this._socket) {
            this._socket.onopen = this._onopen;
        }
    }

    private _onmessage: (event: MessageEvent) => void = null;
    set onmessage(callback: (data: any) => void) {
        this._onmessage = (event: MessageEvent) => {
            if (callback) {
                let data = Socket.deserialize(event.data);
                if (data) {
                    callback(data);
                }
            }
        };
        if (this._socket) {
            this._socket.onmessage = this._onmessage;
        }
    }

    private _onerror: (event: Event) => void = null;
    set onerror(callback: (event?: Event) => void) {
        this._onerror = (event: Event) => {
            if (callback) {
                callback(event);
            }
            console.log(event);
        };
        if (this._socket) {
            this._socket.onerror = this._onerror;
        }
    }

    private _onclose: (event: CloseEvent) => void = null;
    set onclose(callback: (event?: CloseEvent) => void) {
        this._onclose = (event: CloseEvent) => {
            this.status = 'closed';
            if (callback) {
                callback(event);
            }
        };
        if (this._socket) {
            this._socket.onclose = this._onclose;
        }
    }

    static serialize(data: any): ArrayBuffer {
        let decompressed = xson.serialize(data);
        let compressed = pako.deflateRaw(new Uint8Array(decompressed, 0)).buffer;
        let p: Package;
        if (compressed.byteLength < decompressed.byteLength) {
            p = {
                encoding: 'deflate',
                data: compressed
            };
        }
        else {
            p = {
                encoding: 'none',
                data: data
            };
        }
        return xson.serialize(p);
    }

    static deserialize(msg: ArrayBuffer | Uint8Array): any {
        let p = xson.deserialize(msg) as Package;
        if (p.encoding && p.data) {
            if (p.encoding == 'none') {
                return p.data;
            }
            else if (p.encoding == 'deflate') {
                let decompressed = pako.inflateRaw(new Uint8Array(p.data));
                return xson.deserialize(decompressed);
            }
        }
        return null;
    }
}

interface Package {
    encoding: 'none'|'deflate'
    data: any|ArrayBuffer
}
