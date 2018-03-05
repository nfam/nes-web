
const frameSize = 256*240;
const maskSize = frameSize / 8;
const frameCountReset = 180;
const resetable = false;

export default class OutputProcessor {

    private frameCount: number;
    private currentFrame: number[];
    private drawingFrame: number[];
    private audioSamples: number[];

    private pixels: number[];
    private mask: boolean[];
    private flushIt = false;

    constructor() {
        this.frameCount = 0;
        this.currentFrame = new Array(frameSize);
        this.drawingFrame = new Array(frameSize);
        this.audioSamples = [];
        this.pixels = new Array(frameSize);
        this.mask = new Array(frameSize);
    }

    process(data: { video: number[], audio: number[]}): OutputData {
        if (this.flushIt) {
            let frame = data.video;
            for (let i = 0; i < frameSize; i += 1) {
                this.drawingFrame[i] = 0x00ffffff & frame[i];
            }
            this.flushIt = false;
            let pixels = this.getPixels();
            let mask = pixels.length < frameSize ? this.getMask() : new ArrayBuffer(0);
            let pair = this.getPalette(pixels);
            return {
                mask: pixels.length < frameSize ? this.getMask() : new ArrayBuffer(0),
                palette: pair.palette,
                frame: this.getFrame(pixels, pair.map),
                audio8: this.getAudio(this.audioSamples.length ? this.audioSamples.concat(data.audio) : data.audio)
            }
        }
        else {
            this.flushIt = true;
            let temp = this.currentFrame;
            this.currentFrame = this.drawingFrame;
            this.drawingFrame = temp; 
            this.audioSamples = data.audio || [];
            return null;
        }
    }

    private getPixels(): number[] {
        let pixels: number[];

        // Get the different pixels only.
        if (this.frameCount) {
            pixels = this.pixels;
            let mask = this.mask;
            let count = 0;
            for (let i = 0; i < frameSize; i += 1) {
                let pixel = this.drawingFrame[i];
                if (pixel != this.currentFrame[i]) {
                    pixels[count] = pixel;
                    count += 1; 
                    mask[i] = true;
                }
                else {
                    mask[i] = false;
                }
            }
            pixels = pixels.slice(0, count);
        }

        // Get the entire buffer.
        else {
            pixels = this.drawingFrame;
        }

        // If the number of different frames exceeds the threshold,
        // reset it to 0, so that the next frame should be the entire buffer.
        if (resetable) {
            this.frameCount += 1;
            if (this.frameCount >= frameCountReset) {
                this.frameCount = 0;
            }
        }
        else {
            this.frameCount = 1;
        }

        // Flip the frame buffer.
        {
            let temp = this.currentFrame;
            this.currentFrame = this.drawingFrame;
            this.drawingFrame = temp; 
        }

        return pixels;
    }

    private getMask(): ArrayBuffer {
        let bytes = new Uint8Array(maskSize);
        let mask = this.mask;
        for (let i = 0; i < frameSize; i += 8) {
            let byte = 0;
            if (mask[i  ]) byte |= 1;
            if (mask[i+1]) byte |= 1 << 1;
            if (mask[i+2]) byte |= 1 << 2;
            if (mask[i+3]) byte |= 1 << 3;
            if (mask[i+4]) byte |= 1 << 4;
            if (mask[i+5]) byte |= 1 << 5;
            if (mask[i+6]) byte |= 1 << 6;
            if (mask[i+7]) byte |= 1 << 7;
            bytes[i >> 3] = byte;
        }
        return bytes.buffer;
    }

    private getPalette(pixels: number[]): { palette: ArrayBuffer, map: ColorMap } {
        // Get RGB
        let colors: number[] = [];
        let hasColor: { [color: number]: boolean } = {};
        for (let i = 0; i < pixels.length; i += 1) {
            let color = pixels[i];
            if (!hasColor[color]) {
                hasColor[color] = true;
                colors.push(color);
            }
        }

        // Sort color for better compression.
        colors.sort();

        // Generate Palette.
        let palette = new Uint8Array(colors.length * 3);
        let map: ColorMap = {};
        for (let i = 0, j = 0; i < colors.length; i += 1) {
            let color = colors[i];
            map[color] = i;
            palette[j++] = color & 0xFF;
            palette[j++] = (color >> 8) & 0xFF;
            palette[j++] = (color >> 16) & 0xFF;
        }

        return {
            palette: palette.buffer,
            map: map
        };
    }

    private getFrame(pixles: number[], map: ColorMap): ArrayBuffer {
        let frame = new Uint8Array(pixles.length);
        for (let i = 0; i < pixles.length; i += 1) {
            frame[i] = map[pixles[i]];
        }
        return frame.buffer;
    }

    private getAudio(samples: number[]): ArrayBuffer {
        let audio8 = new Uint8Array(samples.length);
        for (let i = 0; i < samples.length; i += 1) {
            // shift from [-1.0, 1.0] to [0.0, 1.0]
            let sample = (samples[i] + 1) / 2.0;

            // scale from [0.0, 0.1] to [0x00,0xFF] and [0x0000,0xFFFF]
            audio8[i] = Math.floor(sample * 255);
        }
        return audio8.buffer;
    }
}

/* export */ export interface OutputData {
    mask: ArrayBuffer // 256*240 bits, each bit represents if a coressponding pixel should be drawn.
    palette: ArrayBuffer // RGB pallete
    frame: ArrayBuffer // 256*240 bytes if mask is empty, or number of 1 bits in maks
    audio8: ArrayBuffer // 8-bit samples, should shift from [0x00,0xFF] to [-1.0,1.0] before playing it.
}

type ColorMap = { [color: number]: number };
