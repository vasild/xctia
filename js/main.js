/* Global variables */

var waypoints;

var task;

var main_map;
var main_map_current_base_layer_name;

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
        var lat = location_xml.getAttribute('latitude');
        var lng = location_xml.getAttribute('longitude');
        var altitude = waypoint_xml.getAttribute('altitude');
        var name = waypoint_xml.getAttribute('name');
        var comment = waypoint_xml.getAttribute('comment');
        var radius = observation_zone_xml.getAttribute('radius') || 1000;
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
            document.getElementById('turnpoint_insert_last_td').parentNode,
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

/* Generic function to parse a file in JavaScript, uploaded in a HTML form.
 * The 'file' parameter must come from the files[] array from a HTML
 * input type
 */
function parse_file(
    /* in: file to parse, must come from the files[] array from a HTML
     * <input type=file>
     */
    file,

    /* in,out: a parser function which is given one parameter - the contents
     * of the file as a string and it returns an object that is passed to the
     * process_result() function
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

        var result = parser(str);

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

/* Generate an URL which contains all data (share). @{ */
function gen_url()
{
    /* Extract
     * http://pg.v5d.org/task/ out of
     * http://pg.v5d.org/task/?whatever...
     */
    var url = document.URL.replace(/^([^?]+).*$/, '$1');

    var arr = new Array();
    arr[0] = waypoints.export_as_array();
    arr[1] = task.export_as_array();
    arr[2] = map_save_state();

    var arr_json = JSON.stringify(arr);

    return(url + '?v=1&d=' + compr_compress_to_uri(arr_json));
}
/* @} */

/* Load the waypoints and the task from the URL of the current page. @{ */
function parse_url()
{
    if (window.location.search == "") {
        return(null);
    }

    var uri = window.location.search.replace(/^.*[?&]d=([^&]+)(&.*$|$)/, '$1');
    if (uri == window.location.search) {
        return(null);
    }

    var arr_json = compr_decompress_from_uri(uri);
    if (!arr_json) {
        alert('Unable to decompress my URL. Was it truncated? ' +
              'URL (' + document.URL.length + ' bytes): ' + document.URL);
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

/* Setup events on two elements so that when the first is clicked
 * (arg.clickable_id) the second one (arg.main_id) is hidden
 * according to the animation rules in arg.hide_keyframes.
 * Before show/hide is started arg.before_hide() or arg.before_show() is
 * called and after show/hide has ended arg.after_show() or arg.after_hide()
 * is called.
 */
function init_animation(
    /* in: arguments, must contain the following elements:
     * clickable_id: (string) the id of the HTML element that is clicked to toggle show/hide
     * main_id: (string) the id of the HTML element that is being shown/hidden
     * hide_keyframes: (string) CSS @keyframes animation specification for the hide action
     * before_hide: (function) callback function to execute before hiding starts
     * after_hide: (function) callback function to execute after hiding has ended
     * show_keyframes: (string) CSS @keyframes animation specification for the show action
     * before_show: (function) callback function to execute before showing starts
     * after_show: (function) callback function to execute after showing has ended
     */
    arg)
{
    function onanimationend(
        e)
    {
        if (e.target.id != arg.main_id) {
            return;
        }

        if (e.target.style.animationName == arg.show_keyframes ||
            e.target.style.webkitAnimationName == arg.show_keyframes) {
            /* Cancel the animation so that the object restores its
             * original state when no animations are active. */
            e.target.style.animationName =
            e.target.style.webkitAnimationName = '';

            arg.after_show();
        } else {
            arg.after_hide();
        }
    }

    var main = document.getElementById(arg.main_id);

    main.addEventListener('animationend', onanimationend);
    main.addEventListener('webkitAnimationEnd', onanimationend);

    document.getElementById(arg.clickable_id).onclick =
        function ()
        {
            if (main.style.animationName == arg.show_keyframes ||
                main.style.animationName == '' ||
                main.style.webkitAnimationName == arg.show_keyframes ||
                main.style.webkitAnimationName == '') {

                if (arg.before_hide) {
                    arg.before_hide();
                }

                main.style.animationName =
                main.style.webkitAnimationName = arg.hide_keyframes;
            } else {
                if (arg.before_show) {
                    arg.before_show();
                }

                main.style.animationName =
                main.style.webkitAnimationName = arg.show_keyframes;
            }
        };
}

/* Initialize the map. */
function init_map(
    state_arr)
{
    var state = map_restore_state(state_arr);

    main_map = L.map('map_div').setView([state.center_lat, state.center_lng],
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

    if (state.base_layer_name == null) {
        state.base_layer_name = Object.keys(base_layers)[0];
    }
    main_map_current_base_layer_name = state.base_layer_name;

    var overlay_layers = {
        'Administrative': layer_administrative,
        'Contrours': layer_contours,
    };

    L.control.layers(base_layers, overlay_layers).addTo(main_map);

    /* Setup the default visible layers. */
    base_layers[state.base_layer_name].addTo(main_map);
    layer_administrative.addTo(main_map);

    L.control.scale(
        {
            imperial: false,
            maxWidth: 300,
        }
    ).addTo(main_map);

    main_map.on(
        'baselayerchange',
        function(layer)
        {
            main_map_current_base_layer_name = layer.name;
        }
    );
}

/* Initialize everything. */
function init()
{
    var params = parse_url();

    /* Initialize various events. */
    ev_init();

    init_map(params != null ? params[2] : null);

    waypoints = waypoints_set_t();

    task = task_t();

    if (params != null) {
        waypoints.import_from_array(params[0]);
        task.import_from_array(params[1]);
    }
}

window.onload = init;

/* vim: set shiftwidth=4 tabstop=4 expandtab foldmethod=marker foldmarker=@{,@}: */
