/*
Copyright (c) 2014-2019, Vasil Dimov, http://xctia.org.
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

/* Global variables */

var map;

var waypoints;

var task;

var flights;

/* Create object of type 'new_obj_type', set its innerHTML to 'text' and
 * append it to 'dest'.
 */
function html_append_obj_with_text(
    /* in,out: HTML object to append to */
    dest,

    /* in: type of the newly created object */
    new_obj_type,

    /* in: text to set inside the newly created object */
    text,

    /* in: attributes to set */
    attributes)
{
    var obj = document.createElement(new_obj_type);
    obj.innerHTML = text;
    if (attributes) {
        for (a in attributes) {
            obj.setAttribute(a, attributes[a]);
        }
    }
    dest.appendChild(obj);
}

/* Find a CSS rule by its name, type and key. @{
 * For example if there is this in the CSS:
 * @keyframes foldup {
 *     0% {
 *         height: 123px;
 *     }
 *     100% {
 *         height: 0px;
 *     }
 * }
 * then html_find_css_rule('foldup', CSSRule.KEYFRAMES_RULE, '0%') will return
 * the first nested rule where one can use rule.style.height to access the
 * '123px' value or rule.style.height='...' to change it.
 * @return the css rule or null if not found
 */
function html_find_css_rule(
    /* in: name of the CSS rule */
    name,
    /* in: type of the CSS rule */
    type,
    /* in: key of the CSS rule */
    key)
{
    /* For all style sheets specified in the HTML with
     * <link type="text/css" rel="stylesheet" href="...">
     */
    for (var i = 0; i < document.styleSheets.length; i++) {
        var ss = document.styleSheets[i];
        try {
            /* We get a security exception in FF if we try to access a
             * stylesheet that is loaded from another domain. We skip those.
             */
            ss.cssRules;
        } catch (e) {
            continue;
        }
        /* In Chrome foreign CSSs are just null, no exception. */
        if (ss.cssRules == null) {
            continue;
        }

        /* For each rule in the file. */
        for (var j = 0; j < ss.cssRules.length; j++) {
            var rule = ss.cssRules[j];
            /* Some rules may not have name or type. */
            if (rule.name && rule.name == name &&
                rule.type && rule.type == type) {
                var r;
                for (var k = 0; k < rule.cssRules.length; k++) {
                    r = rule.cssRules[k];
                    if (r.keyText == key) {
                        return(r);
                    }
                }

                return(null);
            }
        }
    }

    return(null);
}
/* @} */

/* Parse the contents of a waypoints file in the
 * "Cambridge/WinPilot (.dat)" format and add each waypoint to the global
 * 'waypoints' set.
 * @return null
 */
function parser_waypoints(
    /* in: file contents as a string */
    str)
{
    var rows = str.split(/\r?\n/);

    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];

        if (row == "") {
            continue;
        }

        /* 7,42:28:56N,022:45:18E,650M,T,Zemen,Comment */
        var fields = row.split(/,/);

        var alt = fields[3];

        waypoints.add(
            waypoint_t(
                waypoint_data_t(
                    {
                        id: fields[0],
                        lat: coord_convert_ddmmssN2ddd(fields[1]),
                        lng: coord_convert_ddmmssN2ddd(fields[2]),
                        /* Remove the trailing char, '123M' -> '123' */
                        altitude: Number(alt.substr(0, alt.length - 1)),
                        type: fields[4],
                        name: fields[5],
                        comment: fields[6],
                    }
                )
            ),
            true
        );
    }

    return(null);
}

/* Parse the contents of a task file in the "XCSoar (.tsk)" format. @{
 * Also add each turnpoint as a waypoint and as a task turnpoint.
 * @return null
 */
function parser_task(
    /* in: file contents as a string */
    str)
{
    var parser = new DOMParser();
    var dom = parser.parseFromString(str, "text/xml");
    var points_xml = dom.getElementsByTagName('Point');

    for (var i = 0; i < points_xml.length; i++) {
        var point_xml = points_xml[i];

        var waypoint_xml = point_xml.getElementsByTagName('Waypoint')[0];
        var location_xml = point_xml.getElementsByTagName('Location')[0];
        var observation_zone_xml = point_xml.getElementsByTagName('ObservationZone')[0];

        var waypoint_id = waypoints.gen_new_id();
        var lat = Number(location_xml.getAttribute('latitude'));
        var lng = Number(location_xml.getAttribute('longitude'));
        var altitude = Number(waypoint_xml.getAttribute('altitude'));
        var name = waypoint_xml.getAttribute('name');
        var comment = waypoint_xml.getAttribute('comment');
        var radius = Number(observation_zone_xml.getAttribute('radius')) || 1000;
        var turnpoint_type = observation_zone_xml.getAttribute('type');

        waypoints.add(
            waypoint_t(
                waypoint_data_t(
                    {
                        id: waypoint_id,
                        lat: lat,
                        lng: lng,
                        altitude: altitude,
                        type: Object.keys(waypoint_types)[0],
                        name: name,
                        comment: comment,
                    }
                )
            ),
            false
        );

        task.add_turnpoint(
            [
                waypoint_id,
                radius,
                turnpoint_type,
            ]
        );
    }

    if (points_xml.length >= 2) {
        task.redraw_task();
        task.fit_map();
    }

    return(null);
}
/* @} */

/* Get the UTC offset [minutes] of a given location, in a given point in time. @{
 * @return offset in minutes
 */
function get_utc_offset_min(
    /* in: latitude */
    lat,
    /* in: longitude */
    lng,
    /* in: number of seconds since epoch */
    unix_timestamp,
    /* in,out: function to call with the result */
    cb)
{
    var xhr = new XMLHttpRequest();

    var url = 'http://api.geonames.org/timezoneJSON?username=xctia' +
        '&lat=' + lat + '&lng=' + lng;

    xhr.onreadystatechange =
        function ()
        {
            if (this.readyState == this.DONE) {
                var common_error_msg =
                    'The time of the flight will be in UTC. ' +
                    'Try to reload the page to see if this error will go away.';
                if (this.status == 200) {
                    try {
                        var res = JSON.parse(this.responseText);
                        if (res.timezoneId) {
                            /* https://momentjs.com/timezone/docs/#/zone-object/offset/ */
                            var zone = moment.tz.zone(res.timezoneId);
                            var offset = -1 * zone.utcOffset(unix_timestamp * 1000);
                            console.log(res.timezoneId, zone, offset)
                            cb(offset);
                        } else {
                            var msg = 'Got an error from ' + url;
                            if (res.status.message) {
                                msg += ': ' + res.status.message;
                            }
                            msg += '. ' + common_error_msg;
                            alert(msg);
                            console.log(msg);
                            console.log(res);
                            cb(0);
                        }
                    } catch (e) {
                        var msg =
                            'Cannot parse the reply from ' + url +
                            ' (see the console for more details). ' +
                            common_error_msg;
                        alert(msg);
                        console.log(msg);
                        console.log('HTTP response body: ' + this.responseText);
                        console.log(e);
                        cb(0);
                    }
                } else {
                    var msg =
                        'Erroneous HTTP status code (' + this.status +
                        ') from ' + url + '. ' + common_error_msg;
                    alert(msg);
                    console.log(msg);
                    console.log('HTTP response body: ' + this.responseText);
                    console.log(this);
                    cb(0);
                }
            }
        };

    xhr.open('GET', url, true /* async */);

    xhr.send();
}
/* @} */

/* Parse the contents of a flight file in the "IGC" format. @{
 * See http://carrier.csi.cam.ac.uk/forsterlewis/soaring/igc_file_format/
 * @return object of the following type or null
 * {
 *     file_name: ...,
 *     pilot: ...,
 *     glider: ...,
 *     points:
 *     [
 *         {
 *             timestamp: moment() object, see http://momentjs.com/docs/
 *             lat: ...,
 *             lng: ...,
 *             alt_baro: ...,
 *             alt_gps: ...,
 *         },
 *         ...
 *     ]
 * }
 */
function parser_igc(
    /* in: file contents as a string */
    str,
    /* in: file name */
    file_name,
    /* in,out: function to call with the result */
    cb)
{
    var records_array = str.split(/\r?\n/);

    var begin_clock;
    var begin_date;
    var begin_lat;
    var begin_lng;
    var glider;
    var pilot;

    for (var i = 0; i < records_array.length; i++) {
        var rec = records_array[i];
        var res;

        if (begin_clock != undefined &&
            begin_date != undefined &&
            glider != undefined &&
            pilot != undefined) {

            break;
        }

        res = /^HFDTE([0-9]{6})/i.exec(rec);
        if (res != null) {
            begin_date = res[1];
            continue;
        }

        /* Prefer HFPLTPILOTINCHARGE: instead of HFPLTPILOT: */

        res = /^H[A-Z]PLTPILOTINCHARGE:(.+)/i.exec(rec);
        if (res != null) {
            pilot = res[1];
            continue;
        }

        res = /^H[A-Z]PLTPILOT:(.+)/i.exec(rec);
        if (res != null && pilot == undefined) {
            pilot = res[1];
            continue;
        }

        res = /^H[A-Z]GIDGLIDERID:(.+)/i.exec(rec);
        if (res != null) {
            glider = res[1];
            continue;
        }

        res = /^B([0-9]{6})([0-9]{7}[NS])([0-9]{8}[EW])/i.exec(rec);
        if (res != null && begin_clock == undefined) {
            begin_clock = res[1];
            begin_lat = coord_convert_ddmmmmmN2ddd(res[2]);
            begin_lng = coord_convert_ddmmmmmN2ddd(res[3]);
            continue;
        }
    }

    if (begin_clock == undefined || begin_date == undefined) {
        alert('Cannot determine the flight\'s begin date and time' +
              ' from the IGC file ' + file_name);
        return;
    }

    var points = new Array();

    /* Function to continue execution asynchronously. */
    function continue_execution(
        /* in: UTC offset in minutes */
        utc_offset_min)
    {
        for (var i = 0; i < records_array.length; i++) {
            var rec = records_array[i];
            var res = /^B([0-9]{6})([0-9]{7}[NS])([0-9]{8}[EW])A([0-9]{5})([0-9]{5})/i.exec(rec);
            if (res != null) {
                /* http://momentjs.com/docs/#/parsing/utc/ */
                var timestamp = moment.utc(begin_date + res[1], 'DDMMYYHHmmss');

                /* http://momentjs.com/docs/#/manipulating/utc-offset/ */
                timestamp.utcOffset(utc_offset_min);

                var p = {
                    timestamp: timestamp,
                    lat: coord_convert_ddmmmmmN2ddd(res[2]),
                    lng: coord_convert_ddmmmmmN2ddd(res[3]),
                    alt_baro: Number(res[4]),
                    alt_gps: Number(res[5]),
                };

                points.push(p);
            }
        }

        cb({
            file_name: file_name,
            pilot: pilot || 'not set',
            glider: glider || 'not set',
            points: points,
        });
    }

    /* UTC offset in minutes. */
    var utc_offset_min = get_utc_offset_min(
        begin_lat,
        begin_lng,
        moment.utc(begin_date + begin_clock, 'DDMMYYHHmmss').unix(),
        continue_execution);
}
/* @} */

/* Generic function to parse a file in JavaScript, uploaded in a HTML form.
 * The 'file' parameter must come from the files[] array from a HTML
 * input type
 */
function parse_file(
    /* in: file to parse, must come from the files[] array from a HTML
     * <input type=file>
     */
    file,

    /* in,out: a parser function which is given two parameters - the contents
     * of the file as a string and the file name and it returns an object
     * that is passed to the process_result() function
     */
    parser,

    /* in,out: a function which is called with whatever is returned by the
     * parser() function, can be 'null' in which case it is ignored
     */
    process_result)
{
    var reader = new FileReader();

    reader.onloadend = function (e) {
        var str = this.result;

        var result = parser(str, file.name);

        if (process_result != null) {
            process_result(result);
        }
    }

    reader.readAsText(file);
}

/* Save a string as a file on the filesystem of the user's computer. @{ */
function save_str_as_file(
    /* in: string, file's contents */
    str,
    /* in: file name to suggest to the user */
    file_name)
{
    var data_uri = 'data:application/octet-stream;base64,' + base64_encode(str);
    var a = document.getElementById('save_a');
    a.setAttribute('href', data_uri);
    a.setAttribute('download', file_name);
    a.click();
}
/* @} */

/* Generate a=1&b=2&c=3 parameters that contain the app state. @{ */
function gen_url_params()
{
    var arr = new Array();
    arr[0] = waypoints.export_as_array();
    arr[1] = task.export_as_array();
    arr[2] = map.export_state_as_array();
    arr[3] = flights.export_ids_as_array();

    var arr_json = JSON.stringify(arr);

    return('v=1&d=' + compr_compress_to_uri(arr_json));
}
/* @} */

/* Generate an URL which contains all data (share). @{ */
function gen_url()
{
    /* Extract
     * http://foo.bar.com/baz/ out of
     * http://foo.bar.com/baz/#whatever... or
     * http://foo.bar.com/baz/?whatever... (legacy) or
     * http://foo.bar.com/baz/ (no parameters)
     */
    var url_prefix = document.URL.replace(/^([^?#]+).*$/, '$1');

    return(url_prefix + '#' + gen_url_params());
}
/* @} */

/* Regenerate the hash of the current URL. @{
 * Update the string after # in the current URL, e.g. http://foo.bar/sub/#this
 * to describe the current application's state (map position, zoom level, etc).
 */
function regen_url_hash()
{
    window.location.hash = gen_url_params();
}
/* @} */

/* Parse the URL of the current page. @{
 * Parse it into an array that describes the application state. See gen_url().
 */
function parse_url()
{
    var url = window.location.href;

    /* Get everything after the first # or ? */
    var params = url.replace(/^[^#?]+[#?](.+)$/, '$1');
    if (params == url) {
        /* No match. */
        return(null);
    }

    /* Get 'foo' from 'whatever&d=foo&whatever' or there may be nothing
     * before or after 'd=foo'.
     */
    var raw = params.replace(/^(.*&)?d=([^&]+)(&.*)?$/, '$2');
    if (raw == params) {
        /* No match. */
        return(null);
    }

    var arr_json = compr_decompress_from_uri(raw);
    if (!arr_json) {
        alert('Unable to decompress my URL. Was it truncated? ' +
              'URL (' + url.length + ' bytes): ' + url);
        return(null);
    }

    var arr;
    try {
        arr = JSON.parse(arr_json);
    } catch (e) {
        alert(e);
        return(null);
    }

    return(arr);
}
/* @} */

/* Shorten a given url, using a web service. */
function shorten_url(
    /* in: url to shorten */
    url,
    /* in,out: callback function to call with the result on success */
    cb_ok,
    /* in,out: callback function to call with the error message on failure */
    cb_err)
{
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange =
        function ()
        {
            if (this.readyState == this.DONE) {
                if (this.status == 200) {
                    try {
                        var res = JSON.parse(this.responseText);
                        if (res.status_txt.toUpperCase() == 'OK') {
                            cb_ok(res.data.url);
                        } else {
                            cb_err('Got an error from bitly.com: ' +
                                   res.status_txt);
                        }
                    } catch (e) {
                        cb_err('Cannot parse the reply from bitly.com: ' + e +
                               this.responseText);
                    }
                } else {
                    cb_err('Erroneous response from bitly.com: ' +
                           'status=' + this.status +
                           ', text=' + this.responseText);
                }
            }
        }

    xhr.open(
        'GET',
        'https://api-ssl.bitly.com/v3/shorten?' +
        'access_token=ac0e9c4613eb8fd696893b9077e040bd7ff0c92b&longUrl=' +
        encodeURIComponent(url),
        true /* async */);
    xhr.send();
}

/* Initialize everything. */
function init()
{
    var params = parse_url();

    /* Initialize various events. */
    ev_init();

    map = map_t('map_div', params != null ? params[2] : null);

    waypoints = waypoints_set_t();

    task = task_t();

    flights = flights_set_t(params != null ? params[3] : null);

    if (params != null) {
        waypoints.import_from_array(params[0]);
        task.import_from_array(params[1]);
    }
}

window.onload = init;

/* vim: set shiftwidth=4 tabstop=4 expandtab foldmethod=marker foldmarker=@{,@}: */
