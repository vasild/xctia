/* Waypoint */
function waypoint_t(
    /* in: parameters, must contain:
     * - id: unique identificator of this waypoint
     * - lat: fractional number d.ddddd [degrees]
     * - lng: fractional number d.ddddd [degrees]
     * - altitude: integer altitude [meters]
     * - type: string, describing the waypoint type:
     *   - 'T': turnpoint
     *   - 'L': landable
     * - name: name of the waypoint
     * - comment: waypoint comment */
    p)
{
    /* Private member variables */

    var m_id = p.id;

    var m_lat;

    var m_lng;

    set_latlng(p.lat, p.lng);

    var alt = Number(p.altitude.substr(0, p.altitude.length - 1));
    var m_altitude = alt >= 0 ? alt : 0;

    var m_type;
    switch (p.type) {
    case 'L':
    case 'T':
    case 'TH':
        m_type = p.type;
        break;
    default:
        m_type = '?';
    }

    var m_name = p.name;

    var m_comment = p.comment;

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
                return('wp_' + m_id + '_tr');
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

            title: function ()
            {
                return(m_name + (m_comment != '' ? ' (' + m_comment + ')' : ''));
            },

            set_latlng: set_latlng,
        }
    );
}

/* Array of objects of type waypoint_t. */
var waypoints = new Array();

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
    text)
{
    var obj = document.createElement(new_obj_type);
    obj.innerHTML = text;
    dest.appendChild(obj);
}

function on_marker_drag(e, waypoint)
{
    var latlng = e.target.getLatLng();

    document.getElementById('wptr_' + waypoint.id()).children[1].innerHTML =
        latlng.lat.toFixed(5) + '<br/>' +
        latlng.lng.toFixed(5);

    waypoint.set_latlng(latlng.lat, latlng.lng);
}

/* Create a table in the menu area and fill it with the waypoints data. */
function show_waypoints(
    /* in: array of waypoints */
    waypoints)
{
    var table = document.getElementById('waypoints_table');

    table.style.display = 'table';

    /* Header row */
    var header_row_labels = ['Name/Comment', 'Lan/Lng', 'Alt', 'Type'];
    var tr = document.createElement('tr');
    for (var i in header_row_labels) {
        html_append_obj_with_text(tr, 'th', header_row_labels[i]);
    }
    table.appendChild(tr);

    for (var i = 0; i < waypoints.length; i++) {
        var waypoint = waypoints[i];

        tr = document.createElement('tr');
        tr.setAttribute('id', 'wptr_' + waypoint.id());

        html_append_obj_with_text(tr, 'td', waypoint.name() + '<br/>' + waypoint.comment());

        html_append_obj_with_text(tr, 'td',
                                  waypoint.lat().toFixed(5) + '<br/>' +
                                  waypoint.lng().toFixed(5));

        html_append_obj_with_text(tr, 'td', waypoint.altitude());

        html_append_obj_with_text(tr, 'td', waypoint.type());

        table.appendChild(tr);

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

        /* http://en.wikipedia.org/wiki/Immediately-invoked_function_expression */
        (function (p) {
            marker.on(
                'drag',
                function (e) {
                    on_marker_drag(e, p);
                }
            );
        })(waypoint);

        marker.addTo(main_map);
    }
}

/* Parse the contents of a waypoints file in the
 * "Cambridge/WinPilot (.dat)" format and push each waypoint to the global
 * array 'waypoints'.
 * @return the global 'waypoints' array
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

        waypoints.push(
            waypoint_t(
                {
                    id: waypoints.length,
                    lat: coord_convert_ddmmssN2ddd(fields[1]),
                    lng: coord_convert_ddmmssN2ddd(fields[2]),
                    altitude: fields[3],
                    type: fields[4],
                    name: fields[5],
                    comment: fields[6],
                }
            )
        );
    }

    return(waypoints);
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
     * parser() function
     */
    process_result)
{
    var reader = new FileReader();

    reader.onloadend = function (e) {
        var str = this.result;

        var result = parser(str);

        process_result(result);
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
            parse_file(this.files[0], parser_waypoints, show_waypoints);
        }

    document.getElementById('load_waypoints_button').onclick =
        function ()
        {
            document.getElementById('load_waypoints_input').click();
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
