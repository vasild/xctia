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

    function latlng()
    {
        return(m_latlng);
    }

    return(
        {
            latlng: latlng,
        }
    );
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

            var line = map_polyline_t({
                points: [
                    prev_point.latlng(),
                    cur_point.latlng()
                ],
                color: 'red',
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

/* vim: set shiftwidth=4 tabstop=4 expandtab foldmethod=marker foldmarker=@{,@}: */
