var waypoint_types = {
    T: 'Turnpoint',
    L: 'Landing',
    TH: 'Turnpoint (Home)',
};

/* A type that describes a waypoint */
function waypoint_t(
    /* in: parameters, must contain:
     * - id: unique identificator of this waypoint
     * - lat: fractional number d.ddddd [degrees]
     * - lng: fractional number d.ddddd [degrees]
     * - altitude: integer altitude [meters]
     * - type: string, one of waypoint_types' keys
     * - name: name of the waypoint
     * - comment: waypoint comment */
    p)
{
    /* Private member variables */

    var m_id = p.id;

    var m_lat;

    var m_lng;

    set_latlng(p.lat, p.lng);

    var m_altitude = p.altitude >= 0 ? p.altitude : 0;

    var m_type = waypoint_types[p.type] ? p.type : 'T';

    var m_name = p.name;

    var m_comment = p.comment;

    var m_marker = null;

    /* Private methods */

    function set_latlng(
        lat,
        lng)
    {
        m_lat = (-90 <= lat && lat <= 90) ? lat : 0;
        m_lng = (-180 <= lng && lng <= 180) ? lng : 0;
    }

    /* Public methods */

    return(
        {
            id: function ()
            {
                return(m_id);
            },

            lat: function ()
            {
                return(m_lat);
            },

            lng: function ()
            {
                return(m_lng);
            },

            altitude: function ()
            {
                return(m_altitude);
            },

            type: function ()
            {
                return(m_type);
            },

            name: function ()
            {
                return(m_name);
            },

            comment: function ()
            {
                return(m_comment);
            },

            marker: function ()
            {
                return(m_marker);
            },

            title: function ()
            {
                return(m_name + (m_comment != '' ? ' (' + m_comment + ')' : ''));
            },

            set_latlng: set_latlng,

            set_marker: function (marker) {
                m_marker = marker;
            }
        }
    );
}

/* A type that describes a set of waypoints */
function waypoints_set_t()
{
    /* Private member variables */

    var m_waypoints = new Array();

    /* Public methods */

    return(
        {
            add: function (
                     p)
            {
                var i = m_waypoints.length;

                m_waypoints[i] = waypoint_t(
                    {
                        id: i,
                        lat: p.lat,
                        lng: p.lng,
                        altitude: p.altitude,
                        type: p.type,
                        name: p.name,
                        comment: p.comment,
                    }
                );

                show_waypoint(m_waypoints[i]);

                return(i);
            },
        }
    );
}

/* Global variables */

var waypoints = waypoints_set_t();

var main_map;

/* Convert degrees:minutes:secondsN ([d]dd:mm:ssN) to fractional degrees.
 * For example:
 * '42:28:56N' -> 42.48222
 * '42:28:56S' -> -42.48222
 * '22:28:56E' -> 22.48222
 * @return a fractional number
 */
function coord_convert_ddmmssN2ddd(
    /* in: string in the form of '42:56:29N' */
    ddmmssN)
{
    var ddmmss = ddmmssN.substr(0, ddmmssN.length - 1);
    var direction = ddmmssN.substr(-1);
    var f = ddmmss.split(/:/);

    if (!f) {
        return(0);
    }

    var sign;

    if (direction == 'N' || direction == 'n' ||
        direction == 'E' || direction == 'e') {
        sign = 1;
    } else {
        sign = -1;
    }

    return(sign * (Number(f[0]) + Number(f[1]) / 60 + Number(f[2]) / 3600));
}

/* Convert decimal degrees to degrees:minutes:secondsN (dd:mm:ssN).
 * For example:
 * 42.48222, is_lat=true -> '42:28:56N'
 * -42.48222, is_lat=true -> '42:28:56S'
 * 22.48222, is_lat=false -> '22:28:56E'
 * @return string in the form '42:28:56N'
 */
function coord_convert_ddd2ddmmssN(
    /* in: a fractional number */
    ddd,

    /* in: true if the number represents a latitude */
    is_lat)
{
    var direction;

    if (ddd < 0) {
        direction = is_lat ? 'S' : 'W';
        ddd *= -1;
    } else {
        direction = is_lat ? 'N' : 'E';
    }

    var d = Math.floor(ddd);
    var m = Math.floor((ddd - d) * 60);
    var s = Math.floor((ddd - d - m / 60) * 3600);

    return(zero_pad(d, is_lat ? 2 : 3) + ':' +
           zero_pad(m, 2) + ':' +
           zero_pad(s, 2) +
           direction);
}

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

/* Create a row in the waypoints HTML table. */
function waypoint_create_table_row(
    /* in: a waypoint for which to create a row. An event handler is hooked
     * to the lat/lng input boxes in the newly created row, so that when
     * they are edited the waypoint's marked on the map is moved to the new
     * coordinates
     */
    waypoint)
{
    var tr_inner = document.getElementById('{wptr_}').innerHTML;
    /* Replace '{foo}' with 'fooN' were N is the waypoint id */
    tr_inner = tr_inner.replace(/{([^}]+)}/g, '$1' + waypoint.id());

    var tr = document.createElement('tr');
    tr.setAttribute('id', 'wptr_' + waypoint.id());
    tr.innerHTML = tr_inner;

    var new_waypoint_tr = document.getElementById('new_waypoint_tr');
    new_waypoint_tr.parentNode.insertBefore(tr, new_waypoint_tr);

    var id = waypoint.id();

    document.getElementById('wp_lat_' + id).onchange =
    document.getElementById('wp_lng_' + id).onchange =
    function ()
    {
        var lat = document.getElementById('wp_lat_' + id).value;
        var lng = document.getElementById('wp_lng_' + id).value;
        waypoint.set_latlng(lat, lng);
        waypoint.marker().setLatLng([lat, lng]);
    }
}

/* Fill a given waypoint's row in the waypoints HTML table with the data
 * from the waypoint.
 */
function waypoint_fill_table_row_values(
    /* in: waypoint */
    waypoint)
{
    var id = waypoint.id();

    document.getElementById('wp_name_' + id).value = waypoint.name();
    document.getElementById('wp_comment_' + id).value = waypoint.comment();
    document.getElementById('wp_lat_' + id).value = waypoint.lat().toFixed(5);
    document.getElementById('wp_lng_' + id).value = waypoint.lng().toFixed(5);
    document.getElementById('wp_altitude_' + id).value = waypoint.altitude();

    var select = document.getElementById('wp_type_' + id);
    for (t in waypoint_types) {
        var attributes = {value: t};
        if (t == waypoint.type()) {
            attributes.selected = true;
        }

        html_append_obj_with_text(select, 'option', waypoint_types[t], attributes);
    }
}

/* Create a marker on the map for a given waypoint. */
function waypoint_create_marker(
    /* in,out: waypoint, the newly created marker is assigned to the waypoint
     * using waypoint.set_marker() */
    waypoint)
{
    var marker = L.marker(
        [waypoint.lat(), waypoint.lng()],
        {
            draggable: true,
            icon: L.icon(
                {
                    iconAnchor: [7, 7],
                    iconSize: [15, 15],
                    iconUrl: 'img/x-mark-015.png',
                }
            ),
            title: waypoint.title(),
        }
    );

    marker.on(
        'click',
        function (e)
        {
            var id = waypoint.id();
            /* Focus on the waypoint name */
            document.getElementById('wp_name_' + id).focus();

            /* Shake the whole table row */
            var tr = document.getElementById('wptr_' + id);
            tr.addEventListener(
                'animationend',
                function (e)
                {
                    this.classList.remove('animated');
                    this.classList.remove('rubberBand');
                },
                false);
            tr.classList.add('rubberBand');
            tr.classList.add('animated');
        }
    );

    marker.on(
        'drag',
        function (e)
        {
            var id = waypoint.id();
            var ll = e.target.getLatLng();

            document.getElementById('wp_lat_' + id).value = ll.lat.toFixed(5);
            document.getElementById('wp_lng_' + id).value = ll.lng.toFixed(5);

            waypoint.set_latlng(ll.lat, ll.lng);
        }
    );

    marker.addTo(main_map);

    waypoint.set_marker(marker);
}

/* Show a waypoint in the waypoints HTML table and associate a map marker
 * with it.
 */
function show_waypoint(
    /* in,out: waypoint to show */
    waypoint)
{
    waypoint_create_table_row(waypoint);
    waypoint_fill_table_row_values(waypoint);
    waypoint_create_marker(waypoint);
}

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
            {
                lat: coord_convert_ddmmssN2ddd(fields[1]),
                lng: coord_convert_ddmmssN2ddd(fields[2]),
                /* Remove the trailing char, '123M' -> '123' */
                altitude: Number(alt.substr(0, alt.length - 1)),
                type: fields[4],
                name: fields[5],
                comment: fields[6],
            }
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

    document.getElementById('new_waypoint_button').onclick =
        function ()
        {
            var table = document.getElementById('waypoints_table');
            /* table -> tbody -> number of <tr>s */
            var n = zero_pad(table.children[0].children.length, 3);
            var map_center = main_map.getCenter();
            waypoints.add(
                {
                    lat: map_center.lat,
                    lng: map_center.lng,
                    altitude: 0,
                    type: Object.keys(waypoint_types)[0], // use the first by default
                    name: 'wp' + n,
                    comment: 'waypoint ' + n,
                }
            );
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

    /* Add just the default layer to the map, the rest are added via the
     * layers control.
     */
    layer_relief.addTo(main_map);

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
}

window.onload = init;

/* vim: set shiftwidth=4 tabstop=4 expandtab: */
