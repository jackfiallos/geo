var socket = io();
var mapa = null;
var markers = [];
var marker = null;
var circle = null;
var watcher = null;
var lastPosition = null;
var currentPosition = null;
var overlay = null;

window.onunload = function() {
	socket.emit('disconnect');
};

$(document).ready(function() {
	$('#location_button_map').on('click', function() {
		if (!$(this).hasClass('active')) {
			$(this).addClass('active').empty().html('Detener');
			if (navigator.geolocation) {
				watcher = navigator.geolocation.watchPosition(function(position){
					var date = new Date();
					var hour = date.getHours();
					var minutes = date.getMinutes();
					var seconds = date.getSeconds();
					var datetime = hour+':'+minutes+':'+seconds;
					var distance = 0;

					// $('#log').append('<div>Geolocation - '+datetime+'</div>');

					currentPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

					// Establecer la distancia si lastPosition existe (validacion de primera vez)
					if (lastPosition !== null) {
						distance = google.maps.geometry.spherical.computeDistanceBetween(lastPosition, currentPosition);
					}
					else {
						lastPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
					}

					// Si la distancia supera los 5 mts actualizar la posicion de la marca
					if (distance >= 20) {
						// $('#log').append('<div>Actualizando posicion</div>');
						lastPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
						// $('#log').append('<div>'+lastPosition+'</div>');

						socket.emit('position', {
							lat: position.coords.latitude,
							lng: position.coords.longitude
						});
					}

					marker.setPosition(currentPosition);

					mapa.setZoom(17);
					circle.setVisible(true);
					mapa.setCenter(currentPosition);
				}, function(e) {
					alert(e.message);
					circle.setVisible(false);
				}, {
					enableHighAccuracy: true,
					maximumAge: 0,
					timeout: 1000
				});
			}
			else {
				alert('Su dispositivo no permite la geolización');
			}
		}
		else {
			$(this).removeClass('active').empty().html('Iniciar geolocalizacion');
			if ((navigator.geolocation) && (watcher !== null)) {
				navigator.geolocation.clearWatch(watcher);
				circle.setVisible(false);
			}
		}
	});
});

var initialize = function() {
	// Obtener las coordenadas
	navigator.geolocation.getCurrentPosition(function(location) {
		var lat = location.coords.latitude;
		var lng = location.coords.longitude;
		var acc = location.coords.accuracy;

		var baseLocation = {lat: lat, lng: lng};

		// enviar las coordenadas del nuevo cliente al servidor
		socket.emit('position', {
			latitude: lat,
			longitude: lng
		});

		var styleArray = [
		    {
		        "featureType": "administrative.neighborhood",
		        "elementType": "all",
		        "stylers": [
		            {
		                "visibility": "off"
		            }
		        ]
		    },
		    {
		        "featureType": "administrative.land_parcel",
		        "elementType": "all",
		        "stylers": [
		            {
		                "visibility": "off"
		            }
		        ]
		    },
		    {
		        "featureType": "landscape",
		        "elementType": "all",
		        "stylers": [
		            {
		                "visibility": "on"
		            }
		        ]
		    },
		    {
		        "featureType": "landscape",
		        "elementType": "geometry",
		        "stylers": [
		            {
		                "visibility": "simplified"
		            }
		        ]
		    },
		    {
		        "featureType": "poi",
		        "elementType": "all",
		        "stylers": [
		            {
		                "visibility": "off"
		            }
		        ]
		    },
		    {
		        "featureType": "poi",
		        "elementType": "geometry.fill",
		        "stylers": [
		            {
		                "visibility": "off"
		            }
		        ]
		    },
		    {
		        "featureType": "road",
		        "elementType": "all",
		        "stylers": [
		            {
		                "visibility": "on"
		            }
		        ]
		    },
		    {
		        "featureType": "road",
		        "elementType": "geometry",
		        "stylers": [
		            {
		                "lightness": 100
		            }
		        ]
		    },
		    {
		        "featureType": "road",
		        "elementType": "labels",
		        "stylers": [
		            {
		                "visibility": "off"
		            }
		        ]
		    },
		    {
		        "featureType": "transit",
		        "elementType": "all",
		        "stylers": [
		            {
		                "visibility": "simplified"
		            },
		            {
		                "hue": "#ff0000"
		            }
		        ]
		    },
		    {
		        "featureType": "transit.line",
		        "elementType": "geometry",
		        "stylers": [
		            {
		                "lightness": 700
		            }
		        ]
		    },
		    {
		        "featureType": "water",
		        "elementType": "all",
		        "stylers": [
		            {
		                "color": "#37a1bf"
		            }
		        ]
		    }
		];

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

		// marker = new google.maps.Marker({
		// 	title: 'Hello mundo :D',
		// 	map: mapa,
		// 	position: baseLocation,
		// 	icon: 'images/airplane.png'
		// });

		// circle = new google.maps.Circle({
		// 	map: mapa,
		// 	radius: 150, // mts
		// 	strokeColor: '#0049ff',
		// 	strokeOpacity: 0.8,
		// 	strokeWeight: 2,
		// 	strokePosition: google.maps.StrokePosition.CENTER,
		// 	fillColor: '#0049ff'
		// });

		// circle.bindTo('center', marker, 'position');

		overlay = new MapLocationIcon(mapa, lat, lng);

		// google.maps.event.addListener(mapa, 'zoom_changed', function(){
		// 	var bounds = mapa.getBounds();
		// 	var r = 6378.8
		// 	// degrees to radians (divide by 57.2958)
		// 	var ne_lat = bounds.getNorthEast().lat() / 57.2958
		// 	var ne_lng = bounds.getNorthEast().lng() / 57.2958
		// 	var c_lat = bounds.getCenter().lat() / 57.2958
		// 	var c_lng = bounds.getCenter().lng() / 57.2958
		// 	// distance = circle radius from center to Northeast corner of bounds
		// 	var r_km = r * Math.acos(Math.sin(c_lat) * Math.sin(ne_lat) + Math.cos(c_lat) * Math.cos(ne_lat) * Math.cos(ne_lng - c_lng));

		// 	circle.setRadius(r_km * 200);
		// 	mapa.setCenter(marker.getPosition());

		// 	$('#log').append('<div>Zoom changed</div>');
		// });
	}, function(e) {
		alert(e.message);
	});

	MapLocationIcon.prototype = new google.maps.OverlayView();

	MapLocationIcon.prototype.onRemove = function(){
		this.div_.parentNode.removeChild(this.div_);
	}

	//prepare the overlay with DOM
	MapLocationIcon.prototype.onAdd = function(){
		var panes = this.getPanes();
		var overlayProjection = this.getProjection();
		var position = overlayProjection.fromLatLngToDivPixel(this.pos);

		var pixi = document.createElement('div');
		var stage = new PIXI.Container();
		var renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, {transparent: true});
		var graphics = new PIXI.Graphics();
		var cat = null;
		var count = 0;
		var state = play;

		// pixi.style.position = 'absolute';
		document.body.appendChild(pixi);
		// renderer.view.style.border = "3px solid red";
		pixi.appendChild(renderer.view);
		stage.interactive = true;
		stage.addChild(graphics);

		PIXI.loader.add('square', './images/airplane.png').on('progress', function(loader, resource) {
			console.log("loading: " + resource.url);
			console.log("progress: " + loader.progress + "%");
		}).load(function(loader, resources) {
			cat = new PIXI.Sprite(resources.square.texture);
			cat.position.x = position.x - 16;
			cat.position.y = position.y - 16;
			stage.addChild(cat);
			gameLoop();
		});

		function gameLoop() {
			state();
			renderer.render(stage);
			requestAnimationFrame(gameLoop); // Loop this function 60 times per second
		}

		function play() {
			if (count > 150) {
				count = 0;
			}

			graphics.lineStyle(3, 0xf44336, 10/count);
			graphics.drawCircle(position.x, position.y, count);
			if (count%2 == 0) {
				graphics.clear();
			}
			count += 1;
		}

		panes.overlayMouseTarget.appendChild(pixi);
	}


	//set position
	MapLocationIcon.prototype.draw = function(){
		var overlayProjection = this.getProjection();
		var position = overlayProjection.fromLatLngToDivPixel(this.pos);
		var panes = this.getPanes();
		panes.overlayImage.style.left = position.x + 'px';
		panes.overlayImage.style.top = position.y - 30 + 'px';
	}
};

var MapLocationIcon = function(map,lat,lng) {
	this.lat = lat;
	this.lng = lng;
	this.pos = new google.maps.LatLng(lat,lng);
	this.setMap(map);
	this.div_ = null;
}

socket.on('near', function(obj) {
	console.log('cliente conectado', obj);

	if (typeof(obj) !== 'undefined') {
		var socketMarker = new google.maps.Marker({
			title: 'Hello mundo :D',
			map: mapa,
			id: obj.id,
			position: {lat:obj.position.latitude, lng:obj.position.longitude},
			icon: 'images/tank.png'
		});

		markers.push(socketMarker);
	}
});

socket.on('bye', function(id) {
	console.log('cliente desconectado', id);
	for(var i in markers) {
		if (markers[i].id == id) {
			markers[i].setMap(null);
			break;
		}
	}
});
