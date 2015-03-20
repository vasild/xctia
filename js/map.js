/* Global variables. @{ */

var main_map;
var main_map_current_base_layer_name;

/* @} */

/* Map type. @{ */
function map_t(
    /* in: name of the containing HTML div element where to put the map */
    html_div_id,
    /* in: map's initial state array */
    state_arr)
{
    /* Export the current state of the map as an array. @{
     * @return [lat, lng, zoom, current_base_layer_name]
     */
    function export_state_as_array()
    {
        return(
            [
                parseFloat(main_map.getCenter().lat.toFixed(5)),
                parseFloat(main_map.getCenter().lng.toFixed(5)),
                main_map.getZoom(),
                main_map_current_base_layer_name,
            ]
        );
    };
    /* @} */

    /* Generate a descriptive object from an array returned by export_state_as_array(). @{
     * Or generate a default state, if the argument is null (no parameters came
     * from the URL) or undefined (an old URL was given that does not contain
     * those parameters).
     * @return an object with properties: center_lat, center_lng, zoom, base_layer_name
     */
    function state_from_array(
        /* in: array returned by export_state_as_array() */
        arr)
    {
        if (arr) {
            return({
                center_lat: arr[0],
                center_lng: arr[1],
                zoom: arr[2],
                base_layer_name: arr[3],
            });
        } else {
            return({
                /* Center the map in the middle of Bulgaria. */
                center_lat: 42.751046,
                center_lng: 25.268555,
                zoom: 8,
                base_layer_name: null,
            });
        }
    };
    /* @} */

    /* Initialize the map. @{ */
    function init(
        /* in: name of the containing HTML div element where to put the map */
        html_div_id,
        /* in: map's initial state array */
        state_arr)
    {
        var state = state_from_array(state_arr);

        main_map = L.map(html_div_id).setView([state.center_lat, state.center_lng],
                                              state.zoom);

        var max_zoom = 25;

        var layer_relief = L.tileLayer(
            'http://maps-for-free.com/layer/relief/z{z}/row{y}/{z}_{x}-{y}.jpg',
            {
                attribution: '<a href="http://maps-for-free.com">maps-for-free.com</a>',
                maxNativeZoom: 11,
                maxZoom: max_zoom,
            }
        );

        var layer_administrative = L.tileLayer(
            'http://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={token}',
            {
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
                id: 'xctia.e542c64c',
                opacity: 1.0,
                maxNativeZoom: 22,
                maxZoom: max_zoom,
                subdomains: ["a", "b", "c", "d"],
                token: 'pk.eyJ1IjoieGN0aWEiLCJhIjoiQWYwQUNEayJ9._e9tePK42LWuuXClsK5oVg',
            }
        );

        var layer_topoxc = L.tileLayer(
            'http://maps1.pgweb.cz/elev/{z}/{x}/{y}',
            {
                attribution: '<a href="http://xcontest.org">"Topo XC" by courtesy of xcontest.org</a>',
                maxNativeZoom: 19,
                maxZoom: max_zoom,
            }
        );

        var layer_hike = L.tileLayer(
            'http://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={token}',
            {
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
                id: 'mapbox.run-bike-hike',
                maxNativeZoom: 25,
                maxZoom: max_zoom,
                subdomains: ["a", "b", "c", "d"],
                token: 'pk.eyJ1IjoidmFzaWxkIiwiYSI6IkxnS09yWDgifQ.sbC5m00jUB1tK6xmnIogdQ',
            }
        );

        var layer_contours = L.tileLayer(
            'http://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={token}',
            {
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
                id: 'vasild.4f35a6b9',
                opacity: 1.0,
                maxNativeZoom: 22,
                maxZoom: max_zoom,
                subdomains: ["a", "b", "c", "d"],
                token: 'pk.eyJ1IjoidmFzaWxkIiwiYSI6IkxnS09yWDgifQ.sbC5m00jUB1tK6xmnIogdQ',
            }
        );

        var layer_satellite_mapquest = L.tileLayer(
            'http://otile{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg',
            {
                attribution: '<a href="http://mapquest.com">MapQuest Open Aerial Tiles</a>',
                maxNativeZoom: 11,
                maxZoom: max_zoom,
                subdomains: ["1", "2", "3", "4"],
            }
        );

        var layer_satellite_herecom = L.tileLayer(
            'http://{s}.aerial.maps.cit.api.here.com/maptile/2.1/maptile/newest/satellite.day/{z}/{x}/{y}/256/png8?app_id=DemoAppId01082013GAL&app_code=AJKnXv84fjrb0KIHawS0Tg',
            {
                attribution: '<a href="http://here.com">Here.com</a>',
                maxNativeZoom: 20,
                maxZoom: max_zoom,
                subdomains: ["1", "2", "3", "4"],
            }
        );

        var layer_satellite_google = new L.Google();

        var base_layers = {
            'Relief': layer_relief, /* the first one will be used by default */
            'Topo XC': layer_topoxc,
            'Hike': layer_hike,
            'Satellite Google': layer_satellite_google,
            'Satellite MapQuest': layer_satellite_mapquest,
            'Satellite Here.com': layer_satellite_herecom,
        };

        if (state.base_layer_name != null) {
            main_map_current_base_layer_name = state.base_layer_name
        } else {
            main_map_current_base_layer_name = Object.keys(base_layers)[0];
        }

        var overlay_layers = {
            'Administrative': layer_administrative,
            'Contrours': layer_contours,
        };

        L.control.layers(base_layers, overlay_layers).addTo(main_map);

        /* Setup the default visible layers. */
        base_layers[main_map_current_base_layer_name].addTo(main_map);
        layer_administrative.addTo(main_map);

        L.control.scale(
            {
                imperial: false,
                maxWidth: 300,
            }
        ).addTo(main_map);

        main_map.on(
            'baselayerchange',
            function (layer)
            {
                main_map_current_base_layer_name = layer.name;
            }
        );
    }
    /* @} */

    init(html_div_id, state_arr);

    /* Export some of the methods as public. @{ */
    return(
        {
            export_state_as_array: export_state_as_array,
        }
    );
    /* @} */
}
/* @} */

/* vim: set shiftwidth=4 tabstop=4 expandtab foldmethod=marker foldmarker=@{,@}: */
