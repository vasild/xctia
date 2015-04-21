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
    timestamp,
    lat,
    lng,
    alt_baro,
    alt_gps)
{
    var m_fields = {
        timestamp: timestamp,
        lat: lat,
        lng: lng,
        alt_baro: alt_baro,
        alt_gps: alt_gps,
    };

    return(m_fields);
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
    /* array of flight points of type flight_point_t XXX */
    points)
{
    var m_file_name = file_name;
    var m_pilot = pilot;
    var m_glider = glider;
    var m_points = points;

    /* Show the flight on the map. @{ */
    function show_on_map()
    {
        for (var i = 1; i < m_points.length; i++) {
            var line = map_polyline_t({
                points: [
                    [m_points[i - 1].lat, m_points[i - 1].lng],
                    [m_points[i].lat, m_points[i].lng]
                ],
                color: 'red',
                opacity: 1.0,
                width: 2,
            });

            map.add_shape(line);
        }
    }
    /* @} */

    /* Export some of the methods as public. @{ */
    return(
        {
            show_on_map: show_on_map,
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
        var flight = flight_t(
            data.file_name,
            data.pilot,
            data.glider,
            data.points
        );

        m_flights.push(flight);

        flight.show_on_map();
    }
    /* @} */

    /* Export some of the methods as public. @{ */
    return(
        {
            add_flight: add_flight,
        }
    );
    /* @} */
}
/* @} */

/* vim: set shiftwidth=4 tabstop=4 expandtab foldmethod=marker foldmarker=@{,@}: */
