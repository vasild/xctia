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
     * - comment: waypoint comment
     * can be 'null' in which case the created waypoint object is left
     * uninitialized and must later be initialized using the
     * import_from_array() method */
    p)
{
    /* Private member variables */

    var m_id
    var m_lat;
    var m_lng;
    var m_altitude;
    var m_type;
    var m_name;
    var m_comment;
    var m_marker;

    if (p != null) {
        import_from_obj(p);
    }

    /* Private methods, some of them could be exported below. */

    function title()
    {
        return(m_name + (m_comment != '' ? ' (' + m_comment + ')' : ''));
    }

    function set_latlng(
        lat,
        lng)
    {
        m_lat = (-90 <= lat && lat <= 90) ? lat : 0;
        m_lng = (-180 <= lng && lng <= 180) ? lng : 0;
    }

    function set_altitude(
        altitude)
    {
        m_altitude = altitude >= 0 ? altitude : 0;
    }

    function set_type(
        type)
    {
        m_type = waypoint_types[type] ? type : 'T';
    }

    function set_name(
        name)
    {
        m_name = name;
        update_marker_title();
    }

    function set_comment(
        comment)
    {
        m_comment = comment;
        update_marker_title();
    }

    function import_from_obj(
        p)
    {
        m_id = p.id;

        set_latlng(p.lat, p.lng);

        set_altitude(p.altitude);

        set_type(p.type);

        set_name(p.name);

        set_comment(p.comment);

        m_marker = null;
    }

    /* Map related methods */

    /* Create a marker on the map for this waypoint. */
    function create_marker()
    {
        m_marker = L.marker(
            [m_lat, m_lng],
            {
                draggable: true,
                icon: L.icon(
                    {
                        iconAnchor: [7, 7],
                        iconSize: [15, 15],
                        iconUrl: 'img/x-mark-015.png',
                    }
                ),
                title: title(),
            }
        );

        m_marker.on(
            'click',
            function (e)
            {
                /* Focus on the waypoint name */
                document.getElementById('wp_name_' + m_id).focus();

                /* Shake the whole table row */
                var tr = document.getElementById('wptr_' + m_id);
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

        m_marker.on(
            'drag',
            function (e)
            {
                var ll = e.target.getLatLng();

                document.getElementById('wp_lat_' + m_id).value = ll.lat.toFixed(5);
                document.getElementById('wp_lng_' + m_id).value = ll.lng.toFixed(5);

                set_latlng(ll.lat, ll.lng);
            }
        );

        m_marker.addTo(main_map);
    }

    /* Delete the waypoint's marker from the map. */
    function delete_marker()
    {
        main_map.removeLayer(m_marker);
        m_marker = null;
    }

    /* Update the title of a waypoint's marker. Used to regenerate the title
     * after the name or comment of the waypoint has been changed.
     */
    function update_marker_title()
    {
        /* Leaflet does not provide a way to update a marker's title,
         * so we remove the old marker and recreate it.
         */
        if (m_marker != null) {
            delete_marker();
            create_marker();
        }
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

            set_latlng: set_latlng,

            set_altitude: set_altitude,

            set_type: set_type,

            set_name: set_name,

            set_comment: set_comment,

            export_as_array: function ()
            {
                return(
                    [
                        m_lat,
                        m_lng,
                        m_altitude,
                        m_type,
                        m_name,
                        m_comment,
                    ]
                );
            },

            import_from_array: function (
                id,
                arr)
            {
                import_from_obj(
                    {
                        id: id,
                        lat: arr[0],
                        lng: arr[1],
                        altitude: arr[2],
                        type: arr[3],
                        name: arr[4],
                        comment: arr[5]
                    }
                );
            },

            create_marker: create_marker,

            delete_marker: delete_marker,
        }
    );
}

/* Compress a string and encode the result as a valid URI component.
 * @return compressed str, URI-encoded */
function compress_to_uri(
    /* in: string to compress */
    str)
{
    var str_lz_uri = LZString.compressToEncodedURIComponent(str);

    if (str != decompress_from_uri(str_lz_uri)) {
        alert('decompress(compress(str)) != str');
        return('');
    }

    return(str_lz_uri);
}

/* Decompress an URI-encoded and compressed string.
 * @return the string that was passed to compress_to_uri() */
function decompress_from_uri(
    /* in: compressed and URI-encoded string, returned by compress_to_uri() */
    uri)
{
    return(LZString.decompressFromEncodedURIComponent(uri));
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
                /* Create a new element and get its index, hoping that
                 * this is atomic.
                 */
                var i = m_waypoints.push(null) - 1;

                /* if 'p' is an array */
                if (Object.prototype.toString.call(p) ===
                    Object.prototype.toString.call([])) {

                    m_waypoints[i] = waypoint_t(null);
                    m_waypoints[i].import_from_array(i, p);
                } else {
                    m_waypoints[i] = waypoint_t(
                        {
                            id: i,
                            lat: p.lat,
                            lng: p.lng,
                            altitude: p.altitude,
                            type: p.type,
                            name: p.name ? p.name : 'wp' + zero_pad(i, 3),
                            comment: p.comment,
                        }
                    );
                }

                waypoint_show(m_waypoints[i]);
            },

            del: function (
                     waypoint)
            {
                waypoint_remove(waypoint);

                for (var i = 0; i < m_waypoints.length; i++) {
                    if (m_waypoints[i] == waypoint) {
                        m_waypoints[i] = null;
                        break;
                    }
                }
            },

            gen_url: function ()
            {
                /* Extract
                 * http://pg.v5d.org/task/ out of
                 * http://pg.v5d.org/task/?whatever...
                 */
                var url = document.URL.replace(/^([^?]+).*$/, '$1');

                var arr = new Array();

                for (var i = 0; i < m_waypoints.length; i++) {
                    if (m_waypoints[i] != null) {
                        arr.push(m_waypoints[i].export_as_array());
                    }
                }

                var arr_json = JSON.stringify(arr);

                return(url + '?v=1&w=' + compress_to_uri(arr_json));
            }
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

    var id = waypoint.id();

    var tr = document.createElement('tr');
    tr.setAttribute('id', 'wptr_' + id);
    tr.innerHTML = tr_inner;

    var new_waypoint_tr = document.getElementById('new_waypoint_tr');
    new_waypoint_tr.parentNode.insertBefore(tr, new_waypoint_tr);

    var wp_lat = document.getElementById('wp_lat_' + id);
    var wp_lng = document.getElementById('wp_lng_' + id);
    wp_lat.onchange =
    wp_lng.onchange =
        function ()
        {
            waypoint.set_latlng(wp_lat.value, wp_lng.value);
            waypoint.marker().setLatLng([wp_lat.value, wp_lng.value]);
        }

    var wp_altitude = document.getElementById('wp_altitude_' + id);
    wp_altitude.onchange =
        function ()
        {
            waypoint.set_altitude(wp_altitude.value);
        }

    var wp_type = document.getElementById('wp_type_' + id);
    wp_type.onchange =
        function ()
        {
            waypoint.set_type(wp_type.value);
        }

    var wp_name = document.getElementById('wp_name_' + id);
    wp_name.onchange =
        function ()
        {
            waypoint.set_name(wp_name.value);
        }

    var wp_comment = document.getElementById('wp_comment_' + id);
    wp_comment.onchange =
        function ()
        {
            waypoint.set_comment(wp_comment.value);
        }

    document.getElementById('wp_del_' + id).onclick =
        function ()
        {
            waypoints.del(waypoint);
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

/* Show a waypoint in the waypoints HTML table and associate a map marker
 * with it.
 */
function waypoint_show(
    /* in,out: waypoint to show */
    waypoint)
{
    waypoint_create_table_row(waypoint);
    waypoint_fill_table_row_values(waypoint);
    waypoint.create_marker();
}

/* Remove a waypoint from the map (remove its marker) and delete its
 * corresponding row from the HTML waypoints table.
 */
function waypoint_remove(
    /* in: waypoint to remove */
    waypoint)
{
    waypoint.delete_marker();

    var tr = document.getElementById('wptr_' + waypoint.id());
    tr.parentNode.removeChild(tr);
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
            var map_center = main_map.getCenter();
            waypoints.add(
                {
                    lat: map_center.lat,
                    lng: map_center.lng,
                    altitude: 0,
                    type: Object.keys(waypoint_types)[0], // use the first by default
                    comment: '',
                }
            );
        }

    document.getElementById('share_button').onclick =
        function ()
        {
            document.getElementById('share_url').value = waypoints.gen_url();
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

/* Load the waypoints from the URL of the current page, if any waypoints
 * data is passed there.
 */
function load_waypoints_from_url()
{
    if (window.location.search == "") {
        return;
    }

    var uri = window.location.search.replace(/^.*[?&]w=([^&]+)(&.*$|$)/, '$1');
    if (uri == window.location.search) {
        return;
    }

    var arr_json = decompress_from_uri(uri);
    if (arr_json == "") {
        return;
    }

    var arr;
    try {
        arr = JSON.parse(arr_json);
    } catch (e) {
        alert(e);
        return;
    }

    for (var i = 0; i < arr.length; i++) {
        waypoints.add(arr[i]);
    }
}

/* Initialize everything. */
function init()
{
    init_events();
    init_map();
    load_waypoints_from_url();
}

window.onload = init;

/* vim: set shiftwidth=4 tabstop=4 expandtab: */
