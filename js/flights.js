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

    /* Calculate the vario reading compared to an earlier point. @{ */
    function vario_since_gps(
        /* in: earlier flight_point_t */
        earlier)
    {
        return(meters_higher_gps(earlier) / secs_since(earlier));
    }
    /* @} */

    /* Export some of the methods as public. @{ */
    return(
        {
            timestamp: timestamp,
            latlng: latlng,
            alt_gps: alt_gps,
            secs_since: secs_since,
            meters_higher_gps: meters_higher_gps,
            vario_since_gps: vario_since_gps,
        }
    );
    /* @} */
}
/* @} */

/* Flight type @{ */
function flight_t(
    /* in: file name of the flight */
    file_name,
    /* in: pilot name */
    pilot,
    /* glider name/description */
    glider,
    /* array of flight points of type flight_point_t */
    points)
{
    var m_file_name = file_name;
    var m_pilot = pilot;
    var m_glider = glider;
    var m_points = points;

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

    var m_map_shapes = new Array();

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

    /* Show the flight on the map. @{ */
    function redraw_on_map()
    {
        /* Clean up any previous map shapes. */
        for (var i = 0; i < m_map_shapes.length; i++) {
            map.delete_shape(m_map_shapes[i]);
        }
        m_map_shapes = [];

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

            var vario = cur_point.vario_since_gps(prev_point);

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
    }
    /* @} */

    /* Export some of the methods as public. @{ */
    return(
        {
            bounds: bounds,
            redraw_on_map: redraw_on_map,
        }
    );
    /* @} */
}
/* @} */

/* Flights set (type). @{ */
function flights_set_t()
{
    var m_flights = new Array();

    /* Create a new flight from raw data and add it to the set. @{ */
    function add_flight(
        data)
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
            data.file_name,
            data.pilot,
            data.glider,
            flight_points
        );

        m_flights.push(flight);

        flight.redraw_on_map();

        map.fit_bounds(flight.bounds());
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

    /* Export some of the methods as public. @{ */
    return(
        {
            add_flight: add_flight,
            redraw_all_flights: redraw_all_flights,
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
