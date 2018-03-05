import { Inject, EventEmitter, Injectable } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { Socket, SocketStatus } from './socket';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class SocketService {

    private socket: Socket
    private _status: BehaviorSubject<SocketStatus>
    private emitters: { [name: string]: EventEmitter<any> } = {};
    
    constructor(@Inject(APP_BASE_HREF) private baseHref: string) {
        if (this.baseHref.endsWith('/')) {
            this.baseHref = this.baseHref.substring(0, this.baseHref.length - 1);
        }
        this.socket = new Socket(
            window.location.protocol.replace('http', 'ws')
            +'//'+window.location.host
            +this.baseHref
            +'/.socket',
            { tickingSeconds: 5 }
        );
        this._status = new BehaviorSubject<SocketStatus>('closed');
        this.socket.onopen = () => this._status.next('connected');
        this.socket.onclose = (event: CloseEvent) => {
            this._status.next('closed');
        };
        this.socket.onmessage = (message: any) => {
            if (message.name) {
                this.getEmitter(message.name).emit(message.value);
            }
        };
    }

    get status(): Observable<SocketStatus> {
        return this._status;
    }

    socketReady(): Promise<Socket> {
        switch (this._status.getValue()) {
        case 'connected':
            return Promise.resolve(this.socket);
        case 'connecting':
            return this.waitSocket();
        default:
            if (this.socket.connect()) {
                this._status.next('connecting');
                return this.waitSocket();
            }
            else {
                return Promise.reject(new Error('Failed to connect to server'));
            }
        }
    }

    socketConnected(): Socket {
        if (this._status.getValue() == 'connected') {
            return this.socket;
        }
        return null;
    }

    subscribe(name: string, callback: (data: any) => void): any {
       return this.getEmitter(name).subscribe(callback);
    }

    private getEmitter(name: string): EventEmitter<any> {
        let emitter = this.emitters[name];
        if (!emitter) {
            emitter = new EventEmitter<any>();
            this.emitters[name] = emitter;
        }
        return emitter;
    }

    private waitSocket(): Promise<Socket> {
        return new Promise<Socket>((resolve, reject) => {
            let subscription = this.status.subscribe(status => {
                if (status == 'connected') {
                    subscription.unsubscribe();
                    resolve(this.socket);
                }
                else if (status == 'closed') {
                    subscription.unsubscribe();
                    reject(new Error('Failed to connect to server'));
                }
            });
        });
    }
}