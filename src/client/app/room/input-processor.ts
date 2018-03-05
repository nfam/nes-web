import { OutputData } from './output-processor';
import { Output } from 'tsnes';


const frameSize = 256*240;
const maskSize = frameSize / 8;
const frameCountReset = 360;

export default class InputProcessor {

    private currentFrame: number[];
    private filled = false;

    constructor() {
        this.currentFrame = new Array(frameSize);
    }

    process(data: OutputData): Output {
        let colors: number[] = [];
        {
            let bytes = new Uint8Array(data.palette, 0);
            for (let i = 0; i < bytes.length; i += 3) {
                colors.push(
                    bytes[i] +
                    (bytes[i+1] << 8) +
                    (bytes[i+2] << 16)
                );
            }
        }

        let mask: boolean[] = [];
        {
            let bytes = new Uint8Array(data.mask, 0);
            for (let i = 0; i < bytes.length; i += 1) {
                let byte = bytes[i];
                mask.push(!!(byte & (1 << 0)));
                mask.push(!!(byte & (1 << 1)));
                mask.push(!!(byte & (1 << 2)));
                mask.push(!!(byte & (1 << 3)));
                mask.push(!!(byte & (1 << 4)));
                mask.push(!!(byte & (1 << 5)));
                mask.push(!!(byte & (1 << 6)));
                mask.push(!!(byte & (1 << 7)));
            }
        }
        if (mask.length > 0) {
            if (!this.filled) {
                return null;
            }
        }
        else {
            this.filled = true;
        }

        let frame = this.currentFrame;
        {
            let bytes = new Uint8Array(data.frame, 0);
            if (mask.length > 0) {
                for (let i = 0, j = 0; i < mask.length, j < bytes.length; i += 1) {
                    if (mask[i]) {
                        let byte = bytes[j++];
                        if (byte < colors.length) {
                            frame[i] = colors[byte];
                        }
                    }
                }
            }
            else {
                for (let i = 0; i < bytes.length; i += 1) {
                    let byte = bytes[i];
                    if (byte < colors.length) {
                        frame[i] = colors[byte];
                    }
                }
            }
        }

        let samples: number[] = [];
        {
            let bytes = new Uint8Array(data.audio8, 0);
            for (let i = 0; i < bytes.length; i += 1) {
                let byte = bytes[i];
                let sample = ((byte * 2.0) / 255) - 1;
                samples.push(sample);
            }
        }
        return { video: frame, audio: samples };
    }
}

