var socket = io();
var mapa = null;
var marker = null;
var circle = null;
var watcher = null;
var lastPosition = null;
var currentPosition = null;
var overlay = null;
var panes = null;
var overlayProjection = null;
var emitter = null;

var pixi = document.createElement('div');
var stage = new PIXI.Container();
var renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, {transparent: true});
var graphics = new PIXI.Graphics();
var tank = null;
var count = 0;
var elapsed = Date.now();

/**
 * [onunload description]
 * @return {[type]} [description]
 */
window.onunload = function() {
	socket.emit('disconnect');
};

/**
 * [initialize description]
 * @return {[type]} [description]
 */
var initialize = function() {

	// create pixi  layer
	document.body.appendChild(pixi);
	pixi.appendChild(renderer.view);
	stage.interactive = true;
	stage.addChild(graphics);

	PIXI.loader.add({
		'name':'airplane',
		'url':'./images/airplane.png'
	}).add({
		'name':'tank',
		'url':'./images/tank.png'
	}).on('progress', function(loader, resource) {
		//
	}).load(function(loader, resources) {
		// Get current coordinates
		navigator.geolocation.getCurrentPosition(function(location) {
			var lat = location.coords.latitude;
			var lng = location.coords.longitude;
			var acc = location.coords.accuracy;

			var baseLocation = {lat: lat, lng: lng};

			var mapOptions = {
				center: baseLocation,
				draggable: false,
				minZoom: 17,
				zoom: 17,
				maxZoom: 17,
				styles: styleArray,
				disableDoubleClickZoom: true,
				disableDefaultUI: true,
				zoomControl: false,
				mapTypeControl: false,
				zoomControlOptions: {
					style: google.maps.ZoomControlStyle.LARGE,
					position: google.maps.ControlPosition.TOP_LEFT
				},
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};

			mapa = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);

			overlay = new MapLocationIcon(mapa, lat, lng);

		}, function(e) {
			alert(e.message);
		});

		/**
		 * [prototype description]
		 * @type {google}
		 */
		MapLocationIcon.prototype = new google.maps.OverlayView();

		/**
		 * [onRemove description]
		 * @return {[type]} [description]
		 */
		MapLocationIcon.prototype.onRemove = function() {
			this.div_.parentNode.removeChild(this.div_);
		}

		/**
		 * prepare the overlay with DOM
		 * @return {[type]} [description]
		 */
		MapLocationIcon.prototype.onAdd = function() {
			// send coordinates to main server
			socket.emit('position', {
				latitude: this.pos.lat(),
				longitude: this.pos.lng()
			});

			panes = this.getPanes();
			overlayProjection = this.getProjection();
			var position = overlayProjection.fromLatLngToDivPixel(this.pos);
			emitter = new PIXI.particles.Emitter(stage, [PIXI.Texture.fromImage('./images/particle.png')], {
					'alpha': {
						'start': 0.8,
						'end': 0.1
					},
					'scale': {
						'start': 0.55,
						'end': 0.01,
						'minimumScaleMultiplier': 1
					},
					'color': {
						'start': '#e84f12',
						'end': '#ebcb12'
					},
					'speed': {
						'start': 100,
						'end': 50
					},
					'acceleration': {
						'x': 2,
						'y': 8
					},
					'startRotation': {
						'min': 0,
						'max': 360
					},
					'noRotation': false,
					'rotationSpeed': {
						'min': 0,
						'max': 0
					},
					'lifetime': {
						'min': 0.2,
						'max': 1
					},
					'blendMode': 'add',
					'frequency': 0.004,
					'emitterLifetime': 0.2,
					'maxParticles': 500,
					'pos': {
						'x': 0,
						'y': 0
					},
					'addAtBack': false,
					'spawnType': 'point'
				}
			);

			/**
			 * Loop this function 60 times per second
			 * @return {[type]} [description]
			 */
			var gameLoop = function() {
				play();
				renderer.render(stage);
				requestAnimationFrame(gameLoop);
			}

			/**
			 * [play description]
			 * @return {[type]} [description]
			 */
			var play = function() {
				var now = Date.now();
				if (emitter) {
					emitter.update((now - elapsed) * 0.001);
				}
				elapsed = now;

				if (count > 180) {
					count = 0;
				}

				graphics.lineStyle(3, 0xf44336, 10/count);
				graphics.beginFill(0xFF700B, 10/count);
				graphics.drawCircle(position.x, position.y, count);
				if (count%2 == 0) {
					graphics.clear();
				}
				count += 1;
			}

			tank = new PIXI.Sprite(PIXI.loader.resources.tank.texture);
			tank.position.x = position.x - 16;
			tank.position.y = position.y - 16;
			tank.inquire = {
				level: 1,
				life: 100,
				armor: 100,
				ammo: {
					't1': 10,
					't2': 50
				}
			};
			stage.addChild(tank);
			emitter.emit = true;
			gameLoop();

			panes.overlayMouseTarget.appendChild(pixi);
		}

		/**
		 * set position
		 * @return {[type]} [description]
		 */
		MapLocationIcon.prototype.draw = function(){
			var overlayProjection = this.getProjection();
			var position = overlayProjection.fromLatLngToDivPixel(this.pos);
			var panes = this.getPanes();
		}
	});
};

/**
 * [MapLocationIcon description]
 * @param {[type]} map [description]
 * @param {[type]} lat [description]
 * @param {[type]} lng [description]
 */
var MapLocationIcon = function(map, lat, lng) {
	this.lat = lat;
	this.lng = lng;
	this.pos = new google.maps.LatLng(lat,lng);
	this.setMap(map);
	this.div_ = null;
}

/**
 * [geolocalize description]
 * @return {[type]} [description]
 */
var geolocalize = function() {
	if (navigator.geolocation) {
		watcher = navigator.geolocation.watchPosition(function(position) {
			var distance = 0;

			currentPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

			// set lastPosition for the first time
			if (lastPosition !== null) {
				distance = google.maps.geometry.spherical.computeDistanceBetween(lastPosition, currentPosition);
			}
			else {
				lastPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
			}

			// update position if distance greater than 5 mts
			if (distance >= 5) {
				lastPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

				socket.emit('position', {
					lat: position.coords.latitude,
					lng: position.coords.longitude
				});
			}

			marker.setPosition(currentPosition);
			mapa.setCenter(currentPosition);
		}, function(e) {
			alert(e.message);
		}, {
			enableHighAccuracy: true,
			maximumAge: 0,
			timeout: 1000
		});

		navigator.geolocation.clearWatch(watcher);
	}
	else {
		alert('Your device not support geolocalization');
	}
};

/**
 * [socketMarker description]
 * @type {google}
 */
socket.on('near', function(obj) {
	if (typeof(obj) !== 'undefined') {
		var LatLng = new google.maps.LatLng(obj.position.latitude, obj.position.longitude);
		var position = overlayProjection.fromLatLngToDivPixel(LatLng);
		var airplane = new PIXI.Sprite(PIXI.loader.resources.airplane.texture);
		airplane.interactive = true;
		airplane.id = obj.id;
		airplane.inquire = {
			level: 1,
			life: 100,
			armor: 100,
			ammo: {
				't1': 10,
				't2': 50
			}
		};
		airplane.position.x = position.x - 16;
		airplane.position.y = position.y - 16;
		airplane.mousedown = airplane.touchstart = function (e) {
			onShooting(e, position, airplane.inquire);
		}

		stage.addChild(airplane);
	}
});

/**
 * [onShooting description]
 * @param  {[type]} e        [description]
 * @param  {[type]} position [description]
 * @param  {[type]} sprite   [description]
 * @return {[type]}          [description]
 */
function onShooting(e, position, inquire) {
	if(!emitter) return;
	emitter.emit = true;
	emitter.resetPositionTracking();
	emitter.updateOwnerPos(Math.round(position.x), Math.round(position.y));
	console.log(inquire);
}

/**
 * [id description]
 * @type {[type]}
 */
socket.on('closed', function(id) {
	for(var i in stage.children) {
		if (stage.children[i].id == id) {
			stage.removeChildAt(i);
			break;
		}
	}
});
