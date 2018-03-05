# nes-web
[![travis][travis-badge]][travis-url] [![appveyor][appveyor-badge]][appveyor-url] ![license][license-badge]

[Demo](https://game.nfam.me)

Multiplayer Online Classic NES Games on Web Browser, using [`WebRTC`](https://webrtc.org) Peer to Peer connection.

- Supports Gamepad.
- Supports Gamepad Simulation (Keyboard).
- Supports Fullscreen.
- Supports multiple languages.

![Catalog][1]
![Multiplayer][2]

## How to use this image

### Run on host networking

This example uses host networking for simplicity. Also note the `-v` argument. This directory will be used to store `NES` roms and screen images.

```shell
sudo docker run -d \
    --name nes-web \
    -p 8080:8080 \
    -v ~/data/roms:/data/roms \
    -v ~/data/screen:/data/screen \
    nfam/nes-web
```

- ROM file names in /data/roms must end with `.nes` extension.
- Screen images must have `.png` and have the same base name with the corresponding ROM.

#### HTML

Just navigate to `http://{{address}}:8080/`.

[1]: catalog.png
[2]: multiplayer.png

[travis-badge]: https://travis-ci.org/nfam/nes-web.svg
[travis-url]: https://travis-ci.org/nfam/nes-web
[appveyor-badge]: https://ci.appveyor.com/api/projects/status/github/nfam/nes-web?svg=true
[appveyor-url]: https://ci.appveyor.com/project/nfam/nes-web/
[license-badge]: https://img.shields.io/github/license/nfam/nes-web.svg
