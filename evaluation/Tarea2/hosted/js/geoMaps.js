/**
 *
 * geoMaps.js
 * Este fichero contiene la funcionalidad de la geolocalización
 *
 **/

// variable usada para almacenar el mapa
var map;
// variables usadas para almacenar las coordenadas (latitud y longitud) de la última marca situada
var lat, lng;
// variables usadas para almacenar las coordenadas (latitud y longitud) de la posición del usuario. Las guardo para no
// tener que volver a llamar al geolocalizador cuando se pulse en inicializar
var myLat, myLng;
// variable para almacenar el html de las ventanas de información de los marcadores
var template;

// esta zona se ejecutará cuando se cargue la página
$(function(){

    // variable routes de memoria (localStorage) con las rutas almacenadas en formato JSON. Se inicializa como un array vacío []
    localStorage.routes = (localStorage.routes || "[]");

    // cargo en la variable template la plantilla de las ventanas de información de los marcadores
    template = $('#template_marcador').html();

    // función para inicializar el mapa.
    function inicializar(){
        // Inicializa las rutas almacenadas en memoria
        localStorage.routes = "[]";
        // elimina todas las marcas del mapa
        map.removeMarkers();
        // elimina todas las rutas del mapa
        map.cleanRoute();
        // Cojo las coordenadas de myLat y myLng para no tener que llamar a geolocate
        lat = myLat;
        lng = myLng;
        // centro el mapa en mis coordenadas
        map.setCenter(lat, lng);
        // añado al marcador información de la situación en la que se encuentra
        var titulo = "Tu posición en el mapa";
        var content = template.replace(/{{title}}/g, titulo).replace(/{{lat}}/g, lat).replace(/{{lng}}/g, lng);
        // añado el marcador de mi posición en el mapa
        map.addMarker({
            lat: lat,
            lng: lng,
            title: titulo,
            infoWindow:{
                content:content
            }
        });
    }

    // variable que contiene el botón de inicializar
    var $inicializar = $("#inicializar");
    // al evento click del botón de inicializar se le asocia la función inicializar
    $inicializar.on('click', inicializar);

    // función usada cuando se clica sobre el mapa para crear un nuevo marcador y enlazarlo mediante una ruta
    function enlazarNuevoMarcador(e){
        // cojo las coordenadas del punto en el que se ha clicado
        var newLat = e.latLng.lat();
        var newLng = e.latLng.lng();
        // llamo a la función enlazar marcador para crear la ruta y el marcador
        enlazarMarcador(newLat, newLng);
        // recupero los puntos actuales de memoria y los almaceno en un array
        var rutas = JSON.parse(localStorage.routes);
        // meto al final del array las nuevas coordenadas
        rutas[rutas.length] = {lat: newLat, lng: newLng};
        // vuelvo a almacenar en memoria la serialización de todas las coordenadas
        localStorage.routes = JSON.stringify(rutas);
    }

    // función que recibe unas coordenadas (latitud y longitud) y crea un nuevo marcador y la ruta desde el punto anterior en el mapa
    function enlazarMarcador(newLat, newLng){
        // muestra ruta entre marcas anteriores y actuales
        map.drawRoute({
            origin: [lat, lng],  // origen en coordenadas anteriores
            // destino en coordenadas del click o toque actual
            destination: [newLat, newLng],
            travelMode: 'driving',
            strokeColor: 'blue',
            strokeOpacity: 0.6,
            strokeWeight: 3
        });

        // añado al marcador información de la situación en la que se encuentra
        var index = map.markers.length;
        var titulo = "Marcador #"+index;
        var content = template.replace(/{{title}}/g, titulo).replace(/{{lat}}/g, newLat).replace(/{{lng}}/g, newLng);
        // añado nuevo marcador en las coordenadas obtenidas
        map.addMarker({
            lat: newLat,
            lng: newLng,
            title: titulo,
            infoWindow:{
                content: content
            }
        });
        // guarda coordenadas para la marca siguiente
        lat = newLat;
        lng = newLng;
    }

    // función llamada al cargarse la página para localizar la situación del usuario y crear el mapa
    function geolocalizar(){
        // llamo a GMaps.geolocate para saber las coordenadas del usuario
        GMaps.geolocate({
            success: function(position){ // ejecuto esta función si geolocate me devuelve correctamente las coordenadas
                // guarda coords en lat y lng
                lat = myLat = position.coords.latitude;
                lng = myLng = position.coords.longitude;

                // muestra mapa centrado en coords [lat, lng], añadiendo a los eventos click y tap la función enlazarNuevoMarcador
                map = new GMaps({
                    el: '#map',
                    lat: lat,
                    lng: lng,
                    click: enlazarNuevoMarcador,
                    tap: enlazarNuevoMarcador
                });
                // añado al marcador información de la situación en la que se encuentra
                var titulo = "Tu posición en el mapa";
                var content = template.replace(/{{title}}/g, titulo).replace(/{{lat}}/g, lat).replace(/{{lng}}/g, lng);
                // añado el marcador de mi posición en el mapa
                map.addMarker({
                    lat: lat,
                    lng: lng,
                    title: titulo,
                    infoWindow:{
                        content:content
                    }
                });
                // invoco a cargarRutas para recuperar las coordenadas que había en memoria
                cargarRutas();
            },
            error: function(error) { // funcion ejecutada cuando hay un error en la geolocalización
                alert('Geolocalización falla: '+error.message);
            },
            not_supported: function(){ // función ejecutada cuando la geolocalización no está soportado por el navegador
                alert("Su navegador no soporta geolocalización");
            }
        });
    }

    // función que carga de memoria las rutas guardadas
    function cargarRutas(){
        // recupero la variable routes del localStorage y lo almaceno en un array
        var rutas = JSON.parse(localStorage.routes);
        // itero en el array para recuperar todas las coordenadas guardadas
        for (var i = 0; i < rutas.length; i++) {
            // por cada coordenada llamo a enlazarMarcador para crear el marcador y la ruta desde el anterior marcador
            var ruta = rutas[i];
            enlazarMarcador(ruta.lat, ruta.lng);
        }
        if (rutas.length > 0){
            // si hay rutas guardadas, centro el zoom en el mapa para que entren todos los marcadores en el mismo
            map.fitZoom();
        }
    }

    // al cargar llamo a geolocalizar
    geolocalizar();
});
