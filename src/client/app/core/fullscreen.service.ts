import { Injectable, ElementRef } from '@angular/core';

@Injectable()
export class FullscreenService {

    readonly supported: boolean

    constructor() {
        this.supported = document.fullscreenEnabled
            || document.webkitFullscreenEnabled
            || (document as any).mozFullScreenEnabled
            || (document as any).msFullscreenEnabled;
    }

    get fullscreened(): boolean {
        return !!(document.fullscreenElement
            || document.webkitFullscreenElement
            || (document as any).mozFullscreenElement
            || (document as any).msFullscreenElement);
    }

    toggle(element: HTMLElement) {
        if (!this.supported) return;
         if (this.fullscreened) {
            let exitFullscreen = document.exitFullscreen
                || document.webkitExitFullscreen
                || (document as any).mozCancelFullscreen
                || (document as any).msExitFullscreen;
            if (exitFullscreen) {
                exitFullscreen.apply(document);
            }
        }
        else {
            let requestFullscreen = element.requestFullscreen
                || element.webkitRequestFullscreen
                || (element as any).mozRequestFullScreen
                || (element as any).msRequestFullscreen;
            if (requestFullscreen) {
                requestFullscreen.apply(element);
            }
        }
    }
}
