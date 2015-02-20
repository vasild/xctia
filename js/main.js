/* Global variables */

var waypoints;

var task;

var main_map;

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
                        lat: coord_convert_ddmmssN2ddd(fields[1]),
                        lng: coord_convert_ddmmssN2ddd(fields[2]),
                        /* Remove the trailing char, '123M' -> '123' */
                        altitude: Number(alt.substr(0, alt.length - 1)),
                        type: fields[4],
                        name: fields[5],
                        comment: fields[6],
                    }
                )
            )
        );
    }

    return(null);
}

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

/* Save the waypoints in the global waypoints set to a local file on the
 * user's computer.
 */
function save_waypoints()
{
    window.location.href = 'data:' + waypoints.dat_mime_type() + ';base64,' +
        base64_encode(waypoints.export_as_dat());
}

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

    var arr_json = JSON.stringify(arr);

    return(url + '?v=1&d=' + compr_compress_to_uri(arr_json));
}
/* @} */

/* Load the waypoints and the task from the URL of the current page. @{ */
function load_from_url()
{
    if (window.location.search == "") {
        return;
    }

    var uri = window.location.search.replace(/^.*[?&]d=([^&]+)(&.*$|$)/, '$1');
    if (uri == window.location.search) {
        return;
    }

    var arr_json = compr_decompress_from_uri(uri);
    if (!arr_json) {
        alert('Unable to decompress my URL. Was it truncated? ' +
              'URL (' + document.URL.length + ' bytes): ' + document.URL);
        return;
    }

    var arr;
    try {
        arr = JSON.parse(arr_json);
    } catch (e) {
        alert(e);
        return;
    }

    waypoints.import_from_array(arr[0]);
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
 * (click_html_element_id) the second one (fold_html_element_id) is folded
 * up according to the animation rules in animation_up_css_name and
 * animation_down_css_name. After fold down/up is completed call
 * after_folddown_action()/after_foldup_action().
 */
function init_foldupdown(
    /* in: id of the element that triggers the animation by being clicked */
    click_html_element_id,
    /* in: id of the element to fold down/up */
    fold_html_element_id,
    /* in: @keyframes css animation name for up */
    animation_up_css_name,
    /* in: @keyframes css animation name for down */
    animation_down_css_name,
    /* in: function to call when fold up is completed */
    after_foldup_action,
    /* in: function to call when fold down is completed */
    after_folddown_action)
{
    function onanimatinend(
        e)
    {
        if (this.style.animationName == animation_down_css_name ||
            this.style.webkitAnimationName == animation_down_css_name) {
            /* Cancel the animation so that the object restores its
             * original state when no animations are active of height=''
             */
            this.style.animationName =
            this.style.webkitAnimationName = '';

            after_folddown_action();
        } else {
            after_foldup_action();
        }
    }

    var fold_html_element = document.getElementById(fold_html_element_id);

    fold_html_element.addEventListener('animationend', onanimatinend);
    fold_html_element.addEventListener('webkitAnimationEnd', onanimatinend);

    document.getElementById(click_html_element_id).onclick =
        function ()
        {
            var height = fold_html_element.scrollHeight;

            if (fold_html_element.style.animationName == animation_down_css_name ||
                fold_html_element.style.animationName == '' ||
                fold_html_element.style.webkitAnimationName == animation_down_css_name ||
                fold_html_element.style.webkitAnimationName == '') {

                var rule = html_find_css_rule(animation_up_css_name, CSSRule.KEYFRAMES_RULE, '0%');
                if (rule) {
                    rule.style.height = height + 'px';
                    fold_html_element.style.animationName =
                    fold_html_element.style.webkitAnimationName = animation_up_css_name;
                }
            } else {
                var rule = html_find_css_rule(animation_down_css_name, CSSRule.KEYFRAMES_RULE, '100%');
                if (rule) {
                    rule.style.height = height + 'px';
                    fold_html_element.style.animationName =
                    fold_html_element.style.webkitAnimationName = animation_down_css_name;
                }
            }
        };
}

/* Initialize the events:
 * - clicking on the buttons
 */
function init_events()
{
    document.getElementById('load_waypoints_input').onchange =
        function ()
        {
            parse_file(this.files[0], parser_waypoints, null);
        }

    document.getElementById('load_waypoints_button').onclick =
        function ()
        {
            document.getElementById('load_waypoints_input').click();
        }

    document.getElementById('save_waypoints_button').onclick =
        function ()
        {
            save_waypoints();
        }

    document.getElementById('new_waypoint_button').onclick =
        function ()
        {
            var table = document.getElementById('waypoints_table');
            /* table -> tbody -> number of <tr>s */
            var map_center = main_map.getCenter();
            waypoints.add(
                waypoint_t(
                    waypoint_data_t(
                        {
                            lat: map_center.lat,
                            lng: map_center.lng,
                            altitude: 0,
                            /* use the first waypoint type by default */
                            type: Object.keys(waypoint_types)[0],
                            comment: '',
                        }
                    )
                )
            );
        }

    init_foldupdown(
        'waypoints_label_div',
        'waypoints_div',
        'waypoints_foldup',
        'waypoints_folddown',
        function ()
        {
            document.getElementById('waypoints_label_hide_span').style.display = 'none';
            document.getElementById('waypoints_label_show_span').style.display = 'inline';
        },
        function ()
        {
            document.getElementById('waypoints_label_show_span').style.display = 'none';
            document.getElementById('waypoints_label_hide_span').style.display = 'inline';
        }
    );

    init_foldupdown(
        'task_label_div',
        'task_div',
        'task_foldup',
        'task_folddown',
        function ()
        {
            document.getElementById('task_label_hide_span').style.display = 'none';
            document.getElementById('task_label_show_span').style.display = 'inline';
        },
        function ()
        {
            document.getElementById('task_label_show_span').style.display = 'none';
            document.getElementById('task_label_hide_span').style.display = 'inline';
        }
    );

    document.getElementById('turnpoint_insert_last_td').onclick =
        function ()
        {
            task.add_turnpoint(this.parentNode);
        }

    document.getElementById('share_button').onclick =
        function ()
        {
            var url = gen_url();

            document.getElementById('share_table').style.display = 'table';

            shorten_url(
                url,
                /* success callback */
                function (short_url)
                {
                    document.getElementById('share_url_short_input').value = short_url;
                    document.getElementById('share_url_long_input').value = url;
                    document.getElementById('share_qr_img').src =
                        'http://api.qrserver.com/v1/create-qr-code/' +
                        '?data=' + encodeURIComponent(short_url) +
                        '&size=600x600' +
                        '&qzone=1' +
                        '&format=png';
                },
                /* failure callback */
                function (error_msg)
                {
                    alert(error_msg);
                    document.getElementById('share_table').style.display = 'none';
                }
            );
        }

    document.getElementById('share_table').onclick =
        function ()
        {
            document.getElementById('share_table').style.display = 'none';
        }

    document.getElementById('share_url_short_input').onclick =
    document.getElementById('share_url_long_input').onclick =
        function (e)
        {
            /* Avoid the containing table's onclick event being fired because
             * it hides the whole table.
             */
            e.stopPropagation();
        }
}

/* Initialize the map. */
function init_map()
{
    /* Center the map in the middle of Bulgaria. */
    main_map = L.map('map_div').setView([42.751046, 25.268555], 8);

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
        'http://maps-for-free.com/layer/admin/z{z}/row{y}/{z}_{x}-{y}.gif',
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

    var layer_topo = L.tileLayer(
        'http://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={token}',
        {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
            id: 'mapbox.run-bike-hike',
            opacity: 0.5,
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

    /* Add the default and the administrative layer to the map, the rest are
     * added via the layers control.
     */
    layer_relief.addTo(main_map);
    layer_administrative.addTo(main_map);

    L.control.layers(
        {
            'Relief': layer_relief,
            'Topo XC': layer_topoxc,
            'Hike': layer_hike,
            'Satellite Google': layer_satellite_google,
            'Satellite MapQuest': layer_satellite_mapquest,
            'Satellite Here.com': layer_satellite_herecom,
        },
        {
            'Administrative': layer_administrative,
            'Topo': layer_topo,
        }
    ).addTo(main_map);

    L.control.scale(
        {
            imperial: false,
            maxWidth: 300,
        }
    ).addTo(main_map);
}

/* Initialize everything. */
function init()
{
    init_events();

    init_map();

    /* Initialize these before load_from_url() because the latter
     * may try to add elements to them.
     */
    task = task_t();

    waypoints = waypoints_set_t();

    load_from_url();
}

window.onload = init;

/* vim: set shiftwidth=4 tabstop=4 expandtab foldmethod=marker foldmarker=@{,@}: */
