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

/* Flight point type @{ */
function flight_point_t(
    /* in: Date object, containing the timestamp of the point */
    timestamp_arg,
    /* in: map_latlng_t object */
    latlng_arg,
    /* in: barometric altitude */
    alt_baro_arg,
    /* in: gps altitude */
    alt_gps_arg)
{
    var m_timestamp = timestamp_arg;
    var m_latlng = latlng_arg;
    var m_alt_baro = alt_baro_arg;
    var m_alt_gps = alt_gps_arg;

    /* Get the timestamp of this point (Date). @{ */
    function timestamp()
    {
        return(m_timestamp);
    }
    /* @} */

    /* Get the coordinates of this point (map_latlng_t). @{ */
    function latlng()
    {
        return(m_latlng);
    }
    /* @} */

    /* Get the barometric altitude of this point (meters). @{ */
    function alt_baro()
    {
        return(m_alt_baro);
    }
    /* @} */

    /* Get the GPS altitude of this point (meters). @{ */
    function alt_gps()
    {
        return(m_alt_gps);
    }
    /* @} */

    /* Calculate the number of seconds since an earlier point. @{ */
    function secs_since(
        /* in: earlier flight_point_t */
        earlier)
    {
        return(Math.round((m_timestamp - earlier.timestamp()) / 1000));
    }
    /* @} */

    /* Calculate the meters higher than a given lower point. @{ */
    function meters_higher_gps(
        /* in: lower flight_point_t */
        lower)
    {
        return(m_alt_gps - lower.alt_gps());
    }
    /* @} */

    /* Calculate the meters higher than a given lower point. @{ */
    function meters_higher_baro(
        /* in: lower flight_point_t */
        lower)
    {
        return(m_alt_baro - lower.alt_baro());
    }
    /* @} */

    /* Calculate the vario reading compared to an earlier point (GPS). @{ */
    function vario_since_gps(
        /* in: earlier flight_point_t */
        earlier)
    {
        return(meters_higher_gps(earlier) / secs_since(earlier));
    }
    /* @} */

    /* Calculate the vario reading compared to an earlier point (Baro). @{ */
    function vario_since_baro(
        /* in: earlier flight_point_t */
        earlier)
    {
        return(meters_higher_baro(earlier) / secs_since(earlier));
    }
    /* @} */

    /* Export some of the methods as public. @{ */
    return(
        {
            timestamp: timestamp,
            latlng: latlng,
            alt_baro: alt_baro,
            alt_gps: alt_gps,
            secs_since: secs_since,
            meters_higher_baro: meters_higher_baro,
            meters_higher_gps: meters_higher_gps,
            vario_since_baro: vario_since_baro,
            vario_since_gps: vario_since_gps,
        }
    );
    /* @} */
}
/* @} */

/* Flight type @{ */
function flight_t(
    /* in: unique id under which this flight is accounted under in the flights' store */
    store_id_arg,
    /* in: file name of the flight */
    file_name_arg,
    /* in: pilot name */
    pilot_arg,
    /* glider name/description */
    glider_arg,
    /* array of flight points of type flight_point_t */
    points_arg)
{
    var m_vario_color_scale = new Array(
        /* val: vario reading [m/s], color: HTML color code */
        { val:-18, color: 0x000000 /* black */},
        { val:-12, color: 0x0000FF /* blue */},
        { val: -4, color: 0xFF00FF /* pink */},
        { val: -2, color: 0xFF0000 /* red */},
        { val:  0, color: 0xFFFFFF /* white */},
        { val:  2, color: 0x00FF00 /* green */},
        { val:  4, color: 0xFFFF00 /* yellow */},
        { val: 12, color: 0xFF8800 /* orange */}
    );

    var m_store_id = store_id_arg;
    var m_file_name = file_name_arg;
    var m_pilot = pilot_arg;
    var m_glider = glider_arg;
    var m_points = points_arg;

    var m_linear_distance_km = 0;

    /* Initialize m_linear_distance_km, it is a constant. */
    var first_latlng = m_points[0].latlng();
    for (var i = 1; i < m_points.length; i++) {
        var cur_latlng = m_points[i].latlng();

        m_linear_distance_km = Math.max(
            m_linear_distance_km,
            first_latlng.distance_to(cur_latlng) / 1000);
    }

    var m_map_shapes = new Array();

    var m_is_shown_on_map = false;

    /* Get the flight's store id. @{ */
    function store_id()
    {
        return(m_store_id);
    }
    /* @} */

    /* Get the flight's file name. @{ */
    function file_name()
    {
        return(m_file_name);
    }
    /* @} */

    /* Get the flight's pilot name. @{ */
    function pilot()
    {
        return(m_pilot);
    }
    /* @} */

    /* Get the flight's glider name. @{ */
    function glider()
    {
        return(m_glider);
    }
    /* @} */

    /* Get the flight's date. @{
     * @return a string in the format 'YYYY.MM.DD'
     */
    function date()
    {
        return(format_date_into_yyyymmdd(m_points[0].timestamp()));
    }
    /* @} */

    /* Get the flight's duration. @{
     * @return a string in the format 'hh:mm:ss'
     */
    function duration()
    {
        var first = m_points[0];
        var last = m_points[m_points.length - 1];
        return(format_sec_into_hhmmss(last.secs_since(first)));
    }
    /* @} */

    /* Get the flight's linear distance. @{
     * @return a fractional number in kilometers, e.g. 123.4
     */
    function linear_distance()
    {
        return(m_linear_distance_km.toFixed(1));
    }
    /* @} */

    /* Get the flight's bounds. @{ */
    function bounds()
    {
        if (m_points.length == 0) {
            return(null);
        }

        var bounds = map_bounds_t();
        for (var i = 0; i < m_points.length; i++) {
            var latlng = m_points[i].latlng();
            bounds.expand(map_bounds_t(latlng, latlng));
        }

        return(bounds);
    }
    /* @} */

    /* Calculate the number of points inside an area. @{ */
    function n_points_in_bounds(
        /* in: bounds */
        bounds)
    {
        var n = 0;

        for (var i = 0; i < m_points.length; i++) {
            if (bounds.contains_latlng(m_points[i].latlng())) {
                n++;
            }
        }

        return(n);
    }
    /* @} */

    /* Remove the flight from the map. @{ */
    function remove_from_map()
    {
        for (var i = 0; i < m_map_shapes.length; i++) {
            map.delete_shape(m_map_shapes[i]);
        }

        m_map_shapes = [];

        m_is_shown_on_map = false;
    }
    /* @} */

    /* Show the flight on the map. @{ */
    function redraw_on_map()
    {
        /* Clean up any previous map shapes. */
        remove_from_map();

        var map_bounds = map.bounds();

        var n_points_visible = n_points_in_bounds(map_bounds);

        var max_lines_to_draw = 512;

        var every_nth = n_points_visible < max_lines_to_draw
            ? 1
            : Math.round(n_points_visible / max_lines_to_draw);

        var prev_point = m_points[0];
        var prev_point_visible = map_bounds.contains_latlng(prev_point.latlng());

        for (var i = every_nth; i < m_points.length; i += every_nth) {

            var cur_point = m_points[i];
            var cur_point_visible = map_bounds.contains_latlng(cur_point.latlng());

            if (!prev_point_visible && !cur_point_visible) {
                prev_point = cur_point;
                prev_point_visible = cur_point_visible;
                continue;
            }

            /* Draw a line between a point and the previous one if the
             * previous or the point itself is visible.
             */

            var bg_line = map_polyline_t({
                points: [
                    prev_point.latlng(),
                    cur_point.latlng()
                ],
                color: 'black',
                opacity: 1.0,
                width: 4,
            });

            map.add_shape(bg_line);

            m_map_shapes.push(bg_line);

            var vario =
                cur_point.vario_since_gps(prev_point) ||
                cur_point.vario_since_baro(prev_point);

            var color = color_gradient(vario, m_vario_color_scale);

            var line = map_polyline_t({
                points: [
                    prev_point.latlng(),
                    cur_point.latlng()
                ],
                color: color,
                opacity: 1.0,
                width: 2,
            });

            map.add_shape(line);

            m_map_shapes.push(line);

            prev_point = cur_point;
            prev_point_visible = cur_point_visible;
        }

        m_is_shown_on_map = true;
    }
    /* @} */

    /* Check if the flight is shown on the map. @{ */
    function is_shown_on_map()
    {
        return(m_is_shown_on_map);
    }
    /* @} */

    /* Export some of the methods as public. @{ */
    return(
        {
            store_id: store_id,
            file_name: file_name,
            pilot: pilot,
            glider: glider,
            date: date,
            duration: duration,
            linear_distance: linear_distance,
            bounds: bounds,
            remove_from_map: remove_from_map,
            redraw_on_map: redraw_on_map,
            is_shown_on_map: is_shown_on_map,
        }
    );
    /* @} */
}
/* @} */

/* Flights set (type). @{ */
function flights_set_t(
    /* in: array of flights' store ids or undefined or null */
    store_ids)
{
    var m_flights = new Array();

    if (store_ids) {
        import_from_ids_array(store_ids);
    }

    /* Create a new flight from raw data and add it to the set. @{ */
    function add_flight(
        /* in: flight store id or null if putting into the store failed */
        store_id,
        /* in: object returned by parser_igc():
         * {
         *     file_name: ...,
         *     pilot: ...,
         *     glider: ...,
         *     points:
         *     [
         *         {
         *             timestamp: Date object,
         *             lat: ...,
         *             lng: ...,
         *             alt_baro: ...,
         *             alt_gps: ...,
         *         },
         *         ...
         *     ]
         * }
         */
        data,
        /* in: if true then fit the map around the flight after displaying it */
        fit_map_to_flight)
    {
        var flight_points = new Array();
        for (var i = 0; i < data.points.length; i++) {
            var p = data.points[i];
            flight_points.push(
                flight_point_t(
                    p.timestamp,
                    map_latlng_t(p.lat, p.lng),
                    p.alt_baro,
                    p.alt_gps
                )
            );
        }

        var flight = flight_t(
            store_id,
            data.file_name,
            data.pilot,
            data.glider,
            flight_points
        );

        m_flights.push(flight);

        flight.redraw_on_map();

        /* Add the flight to the flights table. */

        var template = document.getElementById('flight_details_template');
        var d = document.createElement('div');
        d.innerHTML = template.innerHTML;

        d.getElementsByClassName('uk-panel-title')[0].innerHTML = flight.file_name();

        d.getElementsByClassName('flight_details_pilot')[0].innerHTML = flight.pilot();

        d.getElementsByClassName('flight_details_glider')[0].innerHTML = flight.glider();

        d.getElementsByClassName('flight_details_date')[0].innerHTML = flight.date();

        d.getElementsByClassName('flight_details_duration')[0].innerHTML = flight.duration();

        d.getElementsByClassName('flight_details_linear_distance')[0].innerHTML = flight.linear_distance() + ' km';

        var zoom_to_button = d.getElementsByClassName('flight_details_zoom_to')[0];

        zoom_to_button.onclick =
            function ()
            {
                if (flight.is_shown_on_map()) {
                    map.fit_bounds(flight.bounds());
                }
            };

        var flight_id = m_flights.length;

        var show_on_map = d.getElementsByClassName('flight_details_show_on_map')[0];

        var checkbox_id = 'flight_details_show_on_map_checkbox_' + flight_id;
        var checkbox_input = show_on_map.getElementsByTagName('input')[0];
        var checkbox_label = show_on_map.getElementsByTagName('label')[0];
        checkbox_input.setAttribute('id', checkbox_id);
        checkbox_label.setAttribute('for', checkbox_id);

        checkbox_input.onchange =
            function ()
            {
                if (this.checked) {
                    flight.redraw_on_map();
                    zoom_to_button.removeAttribute('disabled');
                } else {
                    flight.remove_from_map();
                    zoom_to_button.setAttribute('disabled', true);
                }
            };

        var show_profile = d.getElementsByClassName('flight_details_show_profile')[0];

        checkbox_id = 'flight_details_show_profile_checkbox_' + flight_id;
        checkbox_input = show_profile.getElementsByTagName('input')[0];
        checkbox_label = show_profile.getElementsByTagName('label')[0];
        checkbox_input.setAttribute('id', checkbox_id);
        checkbox_label.setAttribute('for', checkbox_id);

        var profile_is_drawn = false;

        checkbox_input.onchange =
            function ()
            {
                if (this.checked) {
                    if (!profile_is_drawn) {
                        profile_draw(flight_id, flight_points);
                        profile_is_drawn = true;
                    } else {
                        profile_show(flight_id);
                    }
                } else {
                    profile_hide(flight_id);
                }
            };

        template.parentNode.appendChild(d);

        if (fit_map_to_flight) {
            map.fit_bounds(flight.bounds());
        }

        regen_url_hash();
    }
    /* @} */

    /* Redraw all flights on the map. @{ */
    function redraw_all_flights()
    {
        for (var i = 0; i < m_flights.length; i++) {
            m_flights[i].redraw_on_map();
        }
    }
    /* @} */

    /* Export all flights' store ids into an array. @{ */
    function export_ids_as_array()
    {
        var ids = new Array();

        for (var i = 0; i < m_flights.length; i++) {
            var id = m_flights[i].store_id();
            /* id can be null if putting of the flight into the store failed,
             * in this case just skip that flight from the export.
             */
            if (id) {
                ids.push(id);
            }
        }

        return(ids);
    }
    /* @} */

    /* Import flights by store ids. @{ */
    function import_from_ids_array(
        /* in: store ids array */
        store_ids)
    {
        for (var i = 0; i < store_ids.length; i++) {
            store_flight_get(
                store_ids[i],
                /* success callback */
                function(
                    /* in: store id, same as store_ids[i] which is passed as
                     * the first argument to this call to store_flight_get(),
                     * but bound properly. If we use store_ids[i] directly
                     * into the function body below, then when this function
                     * executes, store_ids[i] will be either the last one from
                     * all for() loop iterations or undefined.
                     */
                    store_id,
                    /* in: file name */
                    file_name,
                    /* in: raw IGC contents */
                    igc_raw)
                {
                    var igc_obj = parser_igc(igc_raw, file_name);

                    if (igc_obj == null) {
                        return;
                    }

                    add_flight(store_id, igc_obj, false);
                }
            );
        }
    }
    /* @} */

    /* Export some of the methods as public. @{ */
    return(
        {
            add_flight: add_flight,
            redraw_all_flights: redraw_all_flights,
            export_ids_as_array: export_ids_as_array,
        }
    );
    /* @} */
}
/* @} */

/* Convert a number to a HTML hex color string. @{
 * For example: color_from_n(0x0088FF) == '#0088FF'
 * @return a string, e.g. '#0088FF'
 */
function color_from_n(
    /* in: number, e.g. 0x0088FF */
    n)
{
    return('#' + zero_pad(n.toString(16), 6));
}
/* @} */

/* Derive a coefficient determining the position of n between low and upp. @{
 * For example if low = 10, upp = 20 and n = 17, the coefficient is 0.7.
 * This function assumes that low < n <= upp and returns a number in (0, 1].
 * @return a coefficient in (0, 1]
 */
function color_coeff(
    /* in: lower boundary */
    low,
    /* in: upper boundary */
    upp,
    /* in: number in (low, upp] */
    n)
{
    return((n - low) / (upp - low));
}
/* @} */

/* Return the red component from a color. @{
 * For example, return 0xAB from 0xABCDEF
 * @return a number in [0, 255], denoting the red tint of a color
 */
function color_get_red(
    /* in: color number, e.g. 0xFF00FF for purple */
    color)
{
    return((color & 0xFF0000) >> 16);
}
/* @} */

/* Return the green component from a color. @{
 * For example, return 0xCD from 0xABCDEF
 * @return a number in [0, 255], denoting the green tint of a color
 */
function color_get_green(
    /* in: color number, e.g. 0xFF00FF for purple */
    color)
{
    return((color & 0x00FF00) >> 8);
}
/* @} */

/* Return the blue component from a color. @{
 * For example, return 0xEF from 0xABCDEF
 * @return a number in [0, 255], denoting the blue tint of a color
 */
function color_get_blue(
    /* in: color number, e.g. 0xFF00FF for purple */
    color)
{
    return(color & 0x0000FF);
}
/* @} */

/* Derive a number between n1 and n2 depending on a coefficient. @{
 * For example:
 * if n1 = 30, n2 = 40 and coeff = 0.2, then return 32
 * if n1 = 40, n2 = 30 and coeff = 0.2, then return 38.
 * @return a number in [n1, n2]
 */
function color_scale(
    /* in: boundary 1 */
    n1,
    /* in: boundary 2 */
    n2,
    /* in: distance from boundary 1, as a percentage [0, 1] of the distance
     * between the two boundaries
     */
    coeff)
{
    return(n1 + (n2 - n1) * coeff);
}
/* @} */

/* Derive a color from a color scale, based on value. @{
 * @return a number denoting a color, e.g. 0x0000FF for blue
 */
function color_gradient(
    /* in: value */
    val,
    /* in: scale, like:
     * [
     *     { val: 15, color: 0xFF0000 }
     *     { val: 25, color: 0x000000 }
     * ]
     * a value of 15 would produce red color,
     * a value of 25 - black and
     * a value of 20 - dark red.
     */
    scale)
{
    /* Use the color of the lowest value from the scale, if the given value
     * is too low.
     */
    if (val <= scale[0].val) {
        return(color_from_n(scale[0].color));
    }

    /* Find a range in the scale that contains "val". */
    for (var i = 1; i < scale.length; i++) {
        if (val <= scale[i].val) {
            /* Found a range. Estimate where in the range is "val".
             * E.g. 1 means upper boundary and 0.5 - the middle of the range.
             * "coeff" will be in (0, 1].
             */
            var coeff = color_coeff(scale[i - 1].val, scale[i].val, val);

            /* The colors of the lower and upper boundary of the range. */
            var low_color = scale[i - 1].color;
            var upp_color = scale[i].color;

            /* Estimate the red tint of "val" based on the red tint of
             * the lower boundary, the red tint in the upper boundary and
             * the coefficient.
             */
            var red = color_scale(color_get_red(low_color),
                                  color_get_red(upp_color),
                                  coeff);

            /* Estimate the green tint of "val" based on the green tint of
             * the lower boundary, the green tint in the upper boundary and
             * the coefficient.
             */
            var gre = color_scale(color_get_green(low_color),
                                  color_get_green(upp_color),
                                  coeff);

            /* Estimate the blue tint of "val" based on the blue tint of
             * the lower boundary, the blue tint in the upper boundary and
             * the coefficient.
             */
            var blu = color_scale(color_get_blue(low_color),
                                  color_get_blue(upp_color),
                                  coeff);

            /* Blend the red, green and blue tints. */
            return(color_from_n((red << 16) | (gre << 8) | blu));
        }
    }

    /* If no range matched, this means that "val" is above the highest range.
     * Use the color of the highest range then.
     */
    return(color_from_n(scale[scale.length - 1].color));
}
/* @} */

/* vim: set shiftwidth=4 tabstop=4 expandtab foldmethod=marker foldmarker=@{,@}: */
