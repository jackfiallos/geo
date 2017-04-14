Google Maps realtime game
=========================

Inspired in Pokemon Go, I pretend to build a realtime game using google maps mixed with canvas layer.

This project was build using pixijs lib

Ideas and contributions are welcome :)

### Before start ###

You need to use ssl protocol, so please generate your own keys (server.key - server.crt) and put inside a folder called "ssl" in the main path.

Depending on the pixi branch you donwnload, maybe it's required to compile pixie in order to get the lib compiled.

```
$> cd public/javascripts/vendor/pixi.js && npm install && npm run build
```

### Running the project ###

Execute the following command in project base path

```
$> npm start
```

Open your browser in https://localhost:8443/

### How it works ###

At least you will need at least 2 clients connected, remember this project use sockets.io, basically when clients download the map and connection sockets opens, you'll see the enemies, fight and enjoy the first stage.
