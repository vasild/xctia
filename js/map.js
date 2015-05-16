/*
Copyright (c) 2014-2015, Vasil Dimov, http://xctia.org.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
this list of conditions and the following disclaimer in the documentation
and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/* Lat,Lng type. @{
 * @return a lat,lng object
 */
function map_latlng_t(
    /* in: latitude */
    lat_arg,
    /* in: longitude */
    lng_arg)
{
    var m_latlng = L.latLng(lat_arg, lng_arg);

    /* Get latitude. @{ */
    function lat()
    {
        return(m_latlng.lat);
    }
    /* @} */

    /* Get longitude. @{ */
    function lng()
    {
        return(m_latlng.lng);
    }
    /* @} */

    /* Calculate distance to a given another point. @{
     * @return distance in meters
     */
    function distance_to(
        /* in: another map_latlng_t */
        other)
    {
        return(m_latlng.distanceTo(other.internal()));
    }
    /* @} */

    return(
        {
            distance_to: distance_to,
            internal: function () {
                return(m_latlng);
            },
            lat: lat,
            lng: lng,
        }
    );
}
/* @} */

/* Bounds type. @{
 * @return a bounds object
 */
function map_bounds_t(
    /* in: southwest map_latlng_t or undefined */
    sw,
    /* in: northeast map_latlng_t or undefined */
    ne)
{
    /* L.latLngBounds */
    var m_bounds;

    if (sw && ne) {
        m_bounds = L.latLngBounds(sw.internal(), ne.internal());
    } else {
        m_bounds = null;
    }

    /* Assess whether the bounds contain a given point. @{ */
    function contains_latlng(
        /* in: point coordinates, map_latlng_t */
        latlng)
    {
        return(m_bounds.contains(latlng.internal()));
    }
    /* @} */

    /* Expand. @{ */
    function expand(
        /* in: another map_bounds_t object to expand with */
        bounds)
    {
        if (m_bounds == null) {
            m_bounds = bounds.internal();
        } else {
            m_bounds.extend(bounds.internal());
        }
    }
    /* @} */

    return(
        {
            contains_latlng: contains_latlng,
            expand: expand,
            internal: function () {
                return(m_bounds);
            },
        }
    );
}
/* @} */

/* Icon type. @{
 * @return an icon */
function map_icon_t(
    /* in: icon options */
    opt)
{
    var m_icon = L.icon({
        iconAnchor: opt.icon_anchor,
        iconSize: opt.icon_size,
        iconUrl: opt.icon_url,
    });

    return({
        internal: function () {
            return(m_icon);
        }
    });
}
/* @} */

/* HTML icon type. @{
 * @return an icon */
function map_html_icon_t(
    /* in: html icon options */
    opt)
{
    var m_html_icon = L.divIcon({
        className: opt.class_name,
        html: opt.html,
    });

    return({
        internal: function () {
            return(m_html_icon);
        }
    });
}
/* @} */

/* Circle shape type. @{
 * @return a circle
 */
function map_circle_t(
    /* in: circle options */
    opt)
{
    var m_circle = L.circle(
        [opt.lat, opt.lng],
        opt.radius,
        {
            weight: opt.contour_width,
        }
    );

    /* Set circle's center location. @{ */
    function set_location(
        /* in: [lat, lng] */
        arr)
    {
        m_circle.setLatLng(arr);
    }
    /* @} */

    /* Set circle's radius. @{ */
    function set_radius(
        /* in: radius */
        radius)
    {
        m_circle.setRadius(radius);
    }
    /* @} */

    /* Set semi-circle's properties. @{
     * If both direction and degrees are 0, then disable the semicircle.
     */
    function set_semicircle(
        /* in: direction */
        direction,
        /* in: degrees */
        degrees)
    {
        if (direction == 0 && degrees == 0) {
            /* A trick to fool the Leaflet semicircle plugin to draw a full
             * circle, once it has been a semicircle. */
            m_circle.setDirection(180, 360);
        } else {
            m_circle.setDirection(direction, degrees);
        }
    }
    /* @} */

    /* Get circle's bounds. @{
     * @return map_bounds_t object
     */
    function bounds()
    {
        var b = m_circle.getBounds();
        var sw = map_latlng_t(b.getSouthWest().lat, b.getSouthWest().lng);
        var ne = map_latlng_t(b.getNorthEast().lat, b.getNorthEast().lng);
        return(map_bounds_t(sw, ne));
    }
    /* @} */

    return({
        set_location: set_location,
        set_radius: set_radius,
        set_semicircle: set_semicircle,
        bounds: bounds,
        internal: function () {
            return(m_circle);
        }
    });
}
/* @} */

/* Polyline shape type. @{
 * @return a polyline
 */
function map_polyline_t(
    /* in: polyline options:
     * {
     *     color: string (e.g. '#0000FF'),
     *     opacity: number (e.g. 0.5),
     *     points:
     *     [
     *         map_latlng_t object,
     *         ...
     *     ],
     *     tooltip_text: string (optional)
     *     width: number (line width in pixels),
     * }
     */
    opt)
{
    var leaflet_latlngs = new Array();
    for (var i = 0; i < opt.points.length; i++) {
        leaflet_latlngs.push(opt.points[i].internal());
    }

    var m_polyline = L.polyline(
        leaflet_latlngs,
        {
            color: opt.color,
            opacity: opt.opacity,
            weight: opt.width,
            lineCap: 'butt',
        }
    );

    if (opt.tooltip_text) {
        m_polyline.bindPopup(
            opt.tooltip_text,
            {
                closeButton: false,
            }
        );

        m_polyline.on(
            'mouseover',
            function (e)
            {
                m_polyline.openPopup();
            }
        );
    }

    /* Get polyline's bounds. @{
     * @return map_bounds_t object
     */
    function bounds()
    {
        var b = m_polyline.getBounds();
        var sw = map_latlng_t(b.getSouthWest().lat, b.getSouthWest().lng);
        var ne = map_latlng_t(b.getNorthEast().lat, b.getNorthEast().lng);
        return(map_bounds_t(sw, ne));
    }
    /* @} */

    return(
        {
            internal: function () {
                return(m_polyline);
            },
            bounds: bounds,
        }
    );
}
/* @} */

/* Marker type. @{
 * @return a marker object
 */
function map_marker_t(
    /* in: marker options */
    opt)
{
    var m_marker = L.marker(
        [opt.lat, opt.lng],
        {
            clickable: opt.clickable,
            draggable: opt.draggable,
            icon: opt.icon.internal(),
            keyboard: opt.keyboard,
            title: opt.title,
        }
    );

    if (opt.onclick) {
        m_marker.on('click', opt.onclick);
    }

    if (opt.ondrag) {
        m_marker.on('drag', opt.ondrag);
    }

    /* Set location. @{ */
    function set_location(
        /* in: [lat, lng] */
        arr)
    {
        m_marker.setLatLng(arr);
    }
    /* @} */

    return(
        {
            internal: function () {
                return(m_marker);
            },
            set_location: set_location,
        }
    );
}
/* @} */

/* Map type. @{ */
function map_t(
    /* in: name of the containing HTML div element where to put the map */
    html_div_id,
    /* in: map's initial state array */
    state_arr)
{
    var m_map;
    var m_map_current_base_layer_name;

    /* Export the current state of the map as an array. @{
     * @return [lat, lng, zoom, current_base_layer_name]
     */
    function export_state_as_array()
    {
        return(
            [
                parseFloat(m_map.getCenter().lat.toFixed(5)),
                parseFloat(m_map.getCenter().lng.toFixed(5)),
                m_map.getZoom(),
                m_map_current_base_layer_name,
            ]
        );
    }
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
    }
    /* @} */

    /* Get the center of the map. @{
     * @return {lat: ..., lng: ...}
     */
    function center()
    {
        return(m_map.getCenter());
    }
    /* @} */

    /* Set the center of the map. @{
     */
    function set_center(
        /* in: an object returned by center() */
        center)
    {
        m_map.setView(center);
    }
    /* @} */

    /* Redraw the map. @{
     * Useful when the container div has been resized.
     */
    function redraw()
    {
        m_map.invalidateSize(true /* animate */);
    }
    /* @} */

    /* Add a new shape to the map. @{
     * The shape can be any of:
     * - circle
     */
    function add_shape(
        /* in: shape object */
        shape)
    {
        shape.internal().addTo(m_map);
    }
    /* @} */

    /* Delete a shape from the map. @{ */
    function delete_shape(
        /* in,out: shape */
        shape)
    {
        m_map.removeLayer(shape.internal());
    }
    /* @} */

    /* Get the current lat,lng of the drag from an object passed to the client callback on drag. @{
     * @return {lat: ..., lng: ...}
     */
    function onshape_drag_get_latlng(
        /* in: object that is passed to the caller-supplied ondrag method */
        e)
    {
        return(e.target.getLatLng());
    }
    /* @} */

    /* Get map's bounds. @{
     * @return map_bounds_t object
     */
    function bounds()
    {
        var b = m_map.getBounds();
        var sw = map_latlng_t(b.getSouthWest().lat, b.getSouthWest().lng);
        var ne = map_latlng_t(b.getNorthEast().lat, b.getNorthEast().lng);
        return(map_bounds_t(sw, ne));
    }
    /* @} */

    /* Fit map to bounds. @{ */
    function fit_bounds(
        /* in: map_bounds_t bounds object */
        bounds)
    {
        return(m_map.fitBounds(bounds.internal()));
    }
    /* @} */

    /* Convert [lat, lng] coordinates to [x, y] pixels. @{
     * @return [x, y]
     */
    function latlng_to_pixels(
        /* in: [lat, lng] */
        latlng)
    {
        var p = m_map.project(latlng);
        return([p.x, p.y]);
    }
    /* @} */

    /* Initialize the map. @{ */
    function init(
        /* in: name of the containing HTML div element where to put the map */
        html_div_id,
        /* in: map's initial state array */
        state_arr)
    {
        var state = state_from_array(state_arr);

        m_map = L.map(html_div_id).setView([state.center_lat, state.center_lng],
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

        var layer_topoxc = L.tileLayer(
            'http://maps1.pgweb.cz/elev/{z}/{x}/{y}',
            {
                attribution: '<a href="http://xcontest.org">"Topo XC" by courtesy of xcontest.org</a>',
                maxNativeZoom: 19,
                maxZoom: max_zoom,
            }
        );

        var layer_opentopomap = L.tileLayer(
            'http://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
            {
                attribution: 'Kartendaten: © <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende SRTM | Kartendarstellung: © <a href="http://opentopomap.org/">OpenTopoMap</a>',
                maxNativeZoom: 16,
                maxZoom: max_zoom,
                subdomains: ["a", "b", "c"],
            }
        );

        var layer_hike = L.tileLayer(
            'http://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={token}',
            {
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a> Imagery © <a href="http://mapbox.com">Mapbox</a>',
                id: 'mapbox.run-bike-hike',
                maxNativeZoom: 25,
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

        var layer_terrain_google = new L.Google('TERRAIN');

        var base_layers = {
            'Relief': layer_relief, /* the first one will be used by default */
            'Topo XC': layer_topoxc,
            'OpenTopoMap': layer_opentopomap,
            'Hike': layer_hike,
            'Terrain Google': layer_terrain_google,
            'Satellite Google': layer_satellite_google,
            'Satellite MapQuest': layer_satellite_mapquest,
            'Satellite Here.com': layer_satellite_herecom,
        };

        if (state.base_layer_name != null) {
            m_map_current_base_layer_name = state.base_layer_name
        } else {
            m_map_current_base_layer_name = Object.keys(base_layers)[0];
        }

        var layer_countries = L.tileLayer(
            'http://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={token}',
            {
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a> Imagery © <a href="http://mapbox.com">Mapbox</a>',
                id: 'xctia.e542c64c',
                opacity: 1.0,
                maxNativeZoom: 22,
                maxZoom: max_zoom,
                subdomains: ["a", "b", "c", "d"],
                token: 'pk.eyJ1IjoieGN0aWEiLCJhIjoiQWYwQUNEayJ9._e9tePK42LWuuXClsK5oVg',
            }
        );

        var layer_contours = L.tileLayer(
            'http://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={token}',
            {
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a> Imagery © <a href="http://mapbox.com">Mapbox</a>',
                id: 'vasild.4f35a6b9',
                opacity: 1.0,
                maxNativeZoom: 22,
                maxZoom: max_zoom,
                subdomains: ["a", "b", "c", "d"],
                token: 'pk.eyJ1IjoidmFzaWxkIiwiYSI6IkxnS09yWDgifQ.sbC5m00jUB1tK6xmnIogdQ',
            }
        );

        var layer_skyways = L.tileLayer(
            'http://thermal.kk7.ch/php/tile.php?typ=skyways&t=all&z={z}&x={x}&y={y}&src=' + window.location.hostname,
            {
                attribution: '<a href="http://thermal.kk7.ch/">thermal.kk7.ch</a> by Michael von Känel <a href="http://creativecommons.org/licenses/by-nc-sa/3.0/">CC BY-NC-SA</a>',
                opacity: 1,
                maxNativeZoom: 12,
                maxZoom: max_zoom,
                tms: true,
            }
        );

        var layer_thermals = L.tileLayer(
            'http://thermal.kk7.ch/php/tile.php?typ=thermals&t=all&z={z}&x={x}&y={y}&src=' + window.location.hostname,
            {
                attribution: '<a href="http://thermal.kk7.ch/">thermal.kk7.ch</a> by Michael von Känel <a href="http://creativecommons.org/licenses/by-nc-sa/3.0/">CC BY-NC-SA</a>',
                opacity: 1,
                maxNativeZoom: 12,
                maxZoom: max_zoom,
                tms: true,
            }
        );

        var overlay_layers = {
            'Country borders': layer_countries,
            'Isolines (contours)': layer_contours,
            'Skyways (<a href="http://thermal.kk7.ch/">thermal.kk7.ch</a>)': layer_skyways,
            'Thermals (<a href="http://thermal.kk7.ch/">thermal.kk7.ch</a>)': layer_thermals,
        };

        L.control.layers(base_layers, overlay_layers).addTo(m_map);

        /* Setup the default visible layers. */
        m_map.addLayer(base_layers[m_map_current_base_layer_name]);
        layer_countries.addTo(m_map);

        L.control.scale(
            {
                imperial: false,
                maxWidth: 300,
            }
        ).addTo(m_map);

        m_map.on(
            'baselayerchange',
            function (layer)
            {
                m_map_current_base_layer_name = layer.name;
            }
        );

        m_map.on(
            'moveend',
            function (e)
            {
                flights.redraw_all_flights();
            }
        );
    }
    /* @} */

    init(html_div_id, state_arr);

    /* Export some of the methods as public. @{ */
    return(
        {
            center: center,
            set_center: set_center,
            export_state_as_array: export_state_as_array,
            redraw: redraw,
            add_shape: add_shape,
            delete_shape: delete_shape,
            onshape_drag_get_latlng: onshape_drag_get_latlng,
            bounds: bounds,
            fit_bounds: fit_bounds,
            latlng_to_pixels: latlng_to_pixels,
        }
    );
    /* @} */
}
/* @} */

/* vim: set shiftwidth=4 tabstop=4 expandtab foldmethod=marker foldmarker=@{,@}: */
