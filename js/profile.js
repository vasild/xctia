/*
Copyright (c) 2015-2015, Vasil Dimov, http://xctia.org.
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

var profiles = {};

/* Set profiles' div height in percentage of the screen height. @{ */
function profile_div_set_height(
    /* in: height */
    h)
{
    var remain = 100 - h;

    document.getElementById('menu_wrap_div').style.height =
    document.getElementById('map_div').style.height = remain + '%';

    document.getElementById('cat_peek_wrap_div').style.bottom =
    document.getElementById('cat_run_img').style.bottom = h + '%';

    document.getElementById('profile_chart_div').style.height =
    document.getElementById('profile_stats_point_div').style.height =
    document.getElementById('profile_stats_selection_div').style.height = h + '%';

    map.redraw();
}
/* @} */

/* Show profiles' div if >= 1 profiles are visible or hide it if none is. @{ */
function profile_div_set_visibility()
{
    var at_least_one_is_visible = false;

    var keys = Object.keys(profiles);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (profiles[key].visible) {
            at_least_one_is_visible = true;
            break;
        }
    }

    if (at_least_one_is_visible) {
        profile_div_set_height(20);
    } else {
        profile_div_set_height(0);
    }
}
/* @} */

/* Show an aircraft on the map, over a given point. @{
 * Orient its position, depending on prev_point.
 */
function profile_aircraft_show_at_point(
    /* in: flight id in 'profiles' */
    flight_id,
    /* in: flight_point_t where to put the aircraft */
    point,
    /* in: previous flight_point_t, used to orient the aircraft, or undefined */
    point_prev)
{
    var angle;
    if (point_prev) {
        angle = coord_vector_angle_from_y(
            point_prev.latlng().lat(),
            point_prev.latlng().lng(),
            point.latlng().lat(),
            point.latlng().lng()
        );
    } else {
        angle = 0;
    }

    /* The icon is rotated +45 deg by default. */
    var angle_in_css = (angle - 45).toFixed(2);

    if (!profiles[flight_id].map_marker) {

        var label_html =
            '<i id="aircraft_' + flight_id + '"' +
            ' class="aircraft uk-icon-rocket"' +
            ' style="transform: rotate(' + angle_in_css + 'deg);"></i>';

        profiles[flight_id].map_marker = map_marker_t(
            {
                clickable: false,
                draggable: false,
                icon: map_html_icon_t({
                    class_name: "",
                    icon_anchor: [10, 10],
                    icon_size: [20, 20],
                    html: label_html,
                }),
                keyboard: false,
                lat: point.latlng().lat(),
                lng: point.latlng().lng(),
                onclick: null,
                ondrag: null,
                title: "",
            }
        );
        map.add_shape(profiles[flight_id].map_marker);
    } else {
        profiles[flight_id].map_marker.set_location(
            [
                point.latlng().lat(),
                point.latlng().lng()
            ]
        );
        document.getElementById('aircraft_' + flight_id).style.transform =
            'rotate(' + angle_in_css + 'deg)';
    }
}
/* @} */

/* Remove an aircraft that corresponds to a given flight from the map. @{ */
function profile_aircraft_remove(
    /* in: flight whose aircraft to remove */
    flight_id)
{
    var p = profiles[flight_id];
    if (p.map_marker) {
        map.delete_shape(p.map_marker);
        p.map_marker = null;
    }
}
/* @} */

/* Draw a new flight's profile. @{ */
function profile_draw(
    /* in: flight id, used later to reference this profile when hiding it */
    flight_id,
    /* in: flight's points */
    flight_points)
{
    var chart_data = new Array();
    var flight_points_index_by_timestamp = {};
    var max_altitude = -1;
    var min_altitude = 100000;

    for (var i = 0; i < flight_points.length; i++) {
        var p = flight_points[i];

        var x = p.timestamp().getTime(); /* milliseconds since epoch */
        var y = p.alt_gps() || p.alt_baro();

        chart_data.push([x, y]);

        flight_points_index_by_timestamp[x] = i;

        max_altitude = Math.max(max_altitude, y);
        min_altitude = Math.min(min_altitude, y);
    }

    var chart_options = {
        chart:
        {
            borderWidth: 0,
            events:
            {
                selection: function (e)
                {
                    var profile_chart_div =
                        document.getElementById('profile_chart_div');
                    var profile_stats_selection_div =
                        document.getElementById('profile_stats_selection_div');

                    if (e.xAxis) {
                        /* e.xAxis[0].min and e.xAxis[0].max may contain
                         * intermediate x values that do not belong to any
                         * point. So we need to search for the nearest 'i' for
                         * which flight_points_index_by_timestamp[i] is defined.
                         */

                        /* How many seconds to seek forward or backward for the
                         * beginning or ending of the selected interval before
                         * giving up. If the track log is once per second, then
                         * we will find the point at the first attempt.
                         */
                        var seek_seconds = 100;

                        var beg_msec_since_epoch = Math.round(e.xAxis[0].min / 1000) * 1000;
                        var beg_point;

                        for (var i = beg_msec_since_epoch;
                             i < beg_msec_since_epoch + seek_seconds * 1000;
                             i += 1000) {

                            index = flight_points_index_by_timestamp[i];
                            if (index) {
                                beg_point = flight_points[index];
                                break;
                            }
                        }

                        if (!beg_point) {
                            alert('Cannot find the beginning of the selected ' +
                                  'section in the track log with a timestamp ' +
                                  'between ' +
                                  format_date_into_yyyymmddhhmmsstz(
                                      new Date(beg_msec_since_epoch)) + ' and ' +
                                  format_date_into_yyyymmddhhmmsstz(
                                      new Date(beg_msec_since_epoch + seek_seconds * 1000)));
                            return;
                        }

                        var end_msec_since_epoch = Math.round(e.xAxis[0].max / 1000) * 1000;
                        var end_point;

                        for (i = end_msec_since_epoch;
                             i > end_msec_since_epoch - seek_seconds * 1000;
                             i -= 1000) {

                            index = flight_points_index_by_timestamp[i];
                            if (index) {
                                end_point = flight_points[index];
                                break;
                            }
                        }

                        if (!end_point) {
                            alert('Cannot find the end of the selected ' +
                                  'section in the track log with a timestamp ' +
                                  'between ' +
                                  format_date_into_yyyymmddhhmmsstz(
                                      new Date(end_msec_since_epoch - seek_seconds * 1000)) + ' and ' +
                                  format_date_into_yyyymmddhhmmsstz(
                                      new Date(end_msec_since_epoch)));
                            return;
                        }

                        var distance_m = beg_point.latlng().distance_to(end_point.latlng());
                        var distance_fmt = distance_m < 1000
                            ? (Math.round(distance_m) + ' m')
                            : ((distance_m / 1000).toFixed(1) + ' km');

                        var elevation_diff =
                            end_point.meters_higher_gps(beg_point) ||
                            end_point.meters_higher_baro(beg_point);

                        var duration_sec = end_point.secs_since(beg_point);

                        var avg_glide = elevation_diff < 0
                            ? ((distance_m / elevation_diff * -1).toFixed(1) + ':1')
                            : '+++';

                        var stats_div = document.getElementById('profile_stats_selection_div');

                        stats_div.getElementsByClassName(
                            'profile_stats_avg_glide')[0].innerHTML = avg_glide;

                        stats_div.getElementsByClassName(
                            'profile_stats_avg_speed')[0].innerHTML =
                            (distance_m / duration_sec * 3.6).toFixed(1) + ' km/h';

                        stats_div.getElementsByClassName(
                            'profile_stats_avg_vario')[0].innerHTML =
                            (elevation_diff / duration_sec).toFixed(1) + ' m/s';

                        stats_div.getElementsByClassName(
                            'profile_stats_distance')[0].innerHTML = distance_fmt;

                        stats_div.getElementsByClassName(
                            'profile_stats_duration')[0].innerHTML =
                            format_sec_into_hhmmss(duration_sec);

                        stats_div.getElementsByClassName(
                            'profile_stats_elevation_diff')[0].innerHTML =
                            Math.round(elevation_diff) + ' m';

                        stats_div.getElementsByClassName(
                            'profile_stats_selection_beg')[0].innerHTML =
                            format_date_into_hhmmsstz(beg_point.timestamp());

                        stats_div.getElementsByClassName(
                            'profile_stats_selection_end')[0].innerHTML =
                            format_date_into_hhmmsstz(end_point.timestamp());

                        profile_chart_div.style.width = '70%';
                        profile_stats_selection_div.style.display = 'block';
                        var keys = Object.keys(profiles);
                        for (var i = 0; i < keys.length; i++) {
                            profiles[keys[i]].chart.reflow();
                        }
                    } else {
                        profile_stats_selection_div.style.display = 'none';
                        profile_chart_div.style.width = '85%';
                        var keys = Object.keys(profiles);
                        for (var i = 0; i < keys.length; i++) {
                            profiles[keys[i]].chart.reflow();
                        }
                    }
                }
            },
            renderTo: 'profile_chart_div',
            type: 'spline',
            zoomType: 'x',
        },
        legend:
        {
            enabled: false
        },
        plotOptions:
        {
            series:
            {
                point:
                {
                    events:
                    {
                        /* Fired when the mouse gets anywhere over the chart
                         * canvas, not just over a particular point on the
                         * graph line.
                         */
                        mouseOver: function ()
                        {
                            var stats_div = document.getElementById('profile_stats_point_div');

                            stats_div.getElementsByClassName(
                                'profile_stats_elevation')[0].innerHTML =
                                this.y.toFixed(1) + ' m';

                            /* this.x is always the x value of an existent point,
                             * thus we know that
                             * flight_points_index_by_timestamp[this.x] is defined.
                             */
                            var this_index = flight_points_index_by_timestamp[this.x];
                            var this_p = flight_points[this_index];
                            var prev_p;

                            var speed;
                            var vario;
                            if (this_index > 0) {
                                prev_p = flight_points[this_index - 1];

                                var meters = this_p.latlng().distance_to(prev_p.latlng());
                                var secs = this_p.secs_since(prev_p);
                                speed = (meters / secs * 3.6).toFixed(1) + ' km/h';

                                var v =
                                    this_p.vario_since_gps(prev_p) ||
                                    this_p.vario_since_baro(prev_p);
                                vario = v.toFixed(1) + ' m/s';
                            } else {
                                speed = '';
                                vario = '';
                            }

                            stats_div.getElementsByClassName(
                                'profile_stats_speed')[0].innerHTML = speed;

                            stats_div.getElementsByClassName(
                                'profile_stats_vario')[0].innerHTML = vario;

                            var first_p = flight_points[0];

                            stats_div.getElementsByClassName(
                                'profile_stats_takeoff_distance')[0].innerHTML =
                                (this_p.latlng().distance_to(first_p.latlng()) /
                                 1000).toFixed(1) + ' km';

                            stats_div.getElementsByClassName(
                                'profile_stats_flying_time')[0].innerHTML =
                                format_sec_into_hhmmss(this_p.secs_since(first_p));

                            var date = new Date(this.x);
                            stats_div.getElementsByClassName(
                                'profile_stats_clock')[0].innerHTML =
                                format_date_into_hhmmsstz(date);

                            profile_aircraft_show_at_point(flight_id, this_p, prev_p);
                        }
                    },
                },
                events:
                {
                    mouseOut: function ()
                    {
                        var stats_div = document.getElementById('profile_stats_point_div');

                        stats_div.getElementsByClassName(
                            'profile_stats_elevation')[0].innerHTML =
                        stats_div.getElementsByClassName(
                            'profile_stats_speed')[0].innerHTML =
                        stats_div.getElementsByClassName(
                            'profile_stats_vario')[0].innerHTML =
                        stats_div.getElementsByClassName(
                            'profile_stats_takeoff_distance')[0].innerHTML =
                        stats_div.getElementsByClassName(
                            'profile_stats_flying_time')[0].innerHTML =
                        stats_div.getElementsByClassName(
                            'profile_stats_clock')[0].innerHTML =
                        '';

                        profile_aircraft_remove(flight_id);
                    }
                },
            },
            //areaspline:
            //{
            //    lineWidth: 1,
            //    marker:
            //    {
            //        enabled: false,
            //        states:
            //        {
            //            hover:
            //            {
            //                enabled: true,
            //                radius: 4
            //            }
            //        }
            //    },
            //    shadow: false,
            //    states:
            //    {
            //        hover:
            //        {
            //            lineWidth: 1
            //        }
            //    }
            //},
            spline:
            {
                lineWidth: 1,
                marker:
                {
                    enabled: false,
                    states:
                    {
                        hover:
                        {
                            enabled: true,
                            radius: 2,
                        },
                    },
                },
                states:
                {
                    hover:
                    {
                        lineWidth: 1,
                    },
                },
            },
        },
        series:
        [
            {
                color: '#000000',
                data: chart_data,
                name: 'Altitude',
                type: 'spline',
            },
            //{
            //    color: '#3F0000',
            //    data: chart_data_terrain,
            //    name: 'Terrain',
            //    type: 'areaspline',
            //},
        ],
        subtitle:
        {
            text: '',
        },
        tooltip:
        {
            crosshairs:
            [
                {
                    width: 1,
                    dashStyle: 'LongDash',
                },
                {
                    width: 1,
                    dashStyle: 'LongDash',
                }
            ],
            /* disable the tooltip without disabling the crosshair */
            formatter: function ()
            {
                return(false);
            }
        },
        title:
        {
            text: null,
        },
        xAxis:
        {
            type: 'datetime',
            title:
            {
                text: null,
            },
            labels:
            {
                formatter: function ()
                {
                    return('');
                }
            },
        },
        yAxis:
        {
            endOnTick: false, /* honor 'max:' more */
            labels:
            {
                formatter: function ()
                {
                    return(this.value + 'm');
                }
            },
            max: max_altitude + 100,
            min: min_altitude - 100,
            startOnTick: false, /* honor 'min:' more */
            title:
            {
                text: 'Altitude [m]'
            },
        },
    };

    profiles[flight_id] = {
        visible: true,
        chart: null,
    };

    /* Make it visible before drawing, otherwise Highcharts is confused by
     * the zero height.
     */
    profile_div_set_visibility();

    /* Destroy all others until a way is implemented to display more than
     * one profile.
     */
    var keys = Object.keys(profiles);
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (profiles[k].chart != null) {
            profiles[k].chart.destroy();
            profiles[k].chart = null;
        }
    }

    profiles[flight_id].chart = new Highcharts.Chart(chart_options);
}
/* @} */

/* Show an existent profile if it is hidden. @{ */
function profile_show(
    /* in: flight id */
    flight_id)
{
    profiles[flight_id].visible = true;

    profile_div_set_visibility();
}
/* @} */

/* Hide an existent profile if it is shown. @{ */
function profile_hide(
    /* in: flight id */
    flight_id)
{
    profiles[flight_id].visible = false;

    profile_div_set_visibility();
}
/* @} */

/* vim: set shiftwidth=4 tabstop=4 expandtab foldmethod=marker foldmarker=@{,@}: */
