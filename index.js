/* Waypoints types @{ */

var waypoint_types = {
    T: 'Turnpoint',
    L: 'Landable',
    TH: 'Turnpoint (Home)',
    ATL: 'Airport',
};

/* Basic data fields of a waypoint (type) @{ */
function waypoint_data_t(
    /* in: parameters object or array, must contain:
     * - lat or [0]: fractional number d.ddddd [degrees]
     * - lng or [1]: fractional number d.ddddd [degrees]
     * - altitude or [2]: integer altitude [meters]
     * - type or [3]: string, one of waypoint_types' keys
     * - name or [4]: name of the waypoint
     * - comment or [5]: waypoint comment
     */
    data)
{
    /* Private member variables */

    var m_lat;
    var m_lng;
    var m_altitude;
    var m_type;
    var m_name;
    var m_comment;

    /* if 'data' is an array */
    if (Object.prototype.toString.call(data) ===
        Object.prototype.toString.call([])) {

        import_from_array(data);
    } else {
        import_from_obj(data);
    }

    /* Private methods, some of them could be exported below. */

    /* Set data members from an object. @{ */
    function import_from_obj(
        /* in: object to get the data from */
        p)
    {
        set_latlng(p.lat, p.lng);

        set_altitude(p.altitude);

        set_type(p.type);

        set_name(p.name);

        set_comment(p.comment);
    }
    /* @} */

    /* Set data members from an array. @{ */
    function import_from_array(
        /* in: array to get the data from */
        arr)
    {
        import_from_obj(
            {
                lat: arr[0],
                lng: arr[1],
                altitude: arr[2],
                type: arr[3],
                name: arr[4],
                comment: arr[5],
            }
        );
    }
    /* @} */

    /* Set latitude and longtitude. @{ */
    function set_latlng(
        /* in: latitude */
        lat,
        /* in: longtitude */
        lng)
    {
        m_lat = (-90 <= lat && lat <= 90) ? lat : 0;
        m_lng = (-180 <= lng && lng <= 180) ? lng : 0;
    }
    /* @} */

    /* Get latitude. @{ */
    function lat()
    {
        return(m_lat);
    }
    /* @} */

    /* Get longtitude. @{ */
    function lng()
    {
        return(m_lng);
    }
    /* @} */

    /* Set altitude. @{ */
    function set_altitude(
        altitude)
    {
        m_altitude = altitude >= 0 ? altitude : 0;
    }
    /* @} */

    /* Get altitude. @{ */
    function altitude()
    {
        return(m_altitude);
    }
    /* @} */

    /* Set type. @{ */
    function set_type(
        type)
    {
        m_type = waypoint_types[type] ? type : Object.keys(waypoint_types)[0];
    }
    /* @} */

    /* Get type. @{ */
    function type()
    {
        return(m_type);
    }
    /* @} */

    /* Set name. @{ */
    function set_name(
        name)
    {
        m_name = name ? name : 'wp';
    }
    /* @} */

    /* Get name. @{ */
    function name()
    {
        return(m_name);
    }
    /* @} */

    /* Set comment. @{ */
    function set_comment(
        comment)
    {
        m_comment = comment;
    }
    /* @} */

    /* Get comment. @{ */
    function comment()
    {
        return(m_comment);
    }
    /* @} */

    /* Get title. @{ */
    function title()
    {
        return(m_name + (m_comment != '' ? ' (' + m_comment + ')' : ''));
    }
    /* @} */

    /* Export as array. @{ */
    function export_as_array()
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
    }
    /* @} */

    /* Export as a part of a ".dat" line (without the leading "id,"). @{ */
    function export_as_part_of_dat_line()
    {
        return(
            coord_convert_ddd2ddmmssN(m_lat, true) + ',' +
            coord_convert_ddd2ddmmssN(m_lng, false) + ',' +
            m_altitude + 'M,' +
            m_type + ',' +
            m_name + ',' +
            m_comment
        );
    }
    /* @} */

    /* Export some of the methods as public. @{ */
    return(
        {
            set_latlng: set_latlng,
            lat: lat,
            lng: lng,
            set_altitude: set_altitude,
            altitude: altitude,
            set_type: set_type,
            type: type,
            set_name: set_name,
            name: name,
            set_comment: set_comment,
            comment: comment,
            title: title,
            export_as_array: export_as_array,
            export_as_part_of_dat_line: export_as_part_of_dat_line,
        }
    );
    /* @} */
}
/* @} */

/* Waypoint, including marker on the map (type) @{ */
function waypoint_t(
    /* in: waypoint data */
    waypoint_data)
{
    /* Private member variables */

    var m_id;
    var m_waypoint_data = waypoint_data;
    var m_marker;
    var m_map;

    /* Private methods, some of them could be exported below. */

    /* Set/change the id of the waypoint. @{ */
    function set_id(
        /* in: new id */
        id)
    {
        m_id = id;
    }
    /* @} */

    /* Get the id of the waypoint. @{ */
    function id()
    {
        return(m_id);
    }
    /* @} */

    /* Set/change the name of the waypoint. @{ */
    function set_name(
        /* in: new name */
        name)
    {
        m_waypoint_data.set_name(name);
        update_marker_title();
    }
    /* @} */

    /* Set/change the comment of the waypoint. @{ */
    function set_comment(
        /* in: new comment */
        comment)
    {
        m_waypoint_data.set_comment(comment);
        update_marker_title();
    }
    /* @} */

    /* Create a row in the waypoints HTML table. @{
     * An event handler is hooked to the input boxes in the newly created row,
     * so that when they are edited the waypoint's marker on the map is
     * refreshed accordingly.
     */
    function create_table_row()
    {
        var tr_inner = document.getElementById('{wptr_}').innerHTML;
        /* Replace '{foo}' with 'fooN' were N is the waypoint id */
        tr_inner = tr_inner.replace(/{([^}]+)}/g, '$1' + m_id);

        var tr = document.createElement('tr');
        tr.setAttribute('id', 'wptr_' + m_id);
        tr.innerHTML = tr_inner;

        var new_waypoint_tr = document.getElementById('new_waypoint_tr');
        new_waypoint_tr.parentNode.insertBefore(tr, new_waypoint_tr);

        var wp_lat = document.getElementById('wp_lat_' + m_id);
        var wp_lng = document.getElementById('wp_lng_' + m_id);
        wp_lat.onchange =
        wp_lng.onchange =
            function ()
            {
                m_waypoint_data.set_latlng(wp_lat.value, wp_lng.value);
                m_marker.setLatLng([wp_lat.value, wp_lng.value]);
            }

        document.getElementById('wp_altitude_' + m_id).onchange =
            function ()
            {
                m_waypoint_data.set_altitude(this.value);
            }

        document.getElementById('wp_type_' + m_id).onchange =
            function ()
            {
                m_waypoint_data.set_type(this.value);
            }

        document.getElementById('wp_name_' + m_id).onchange =
            function ()
            {
                set_name(this.value);
            }

        document.getElementById('wp_comment_' + m_id).onchange =
            function ()
            {
                set_comment(this.value);
            }

        document.getElementById('wp_del_' + m_id).onclick =
            function ()
            {
                delete_marker();

                delete_table_row();

                waypoints.del(m_id);
            }

        document.getElementById('wp_name_' + m_id).value = m_waypoint_data.name();
        document.getElementById('wp_comment_' + m_id).value = m_waypoint_data.comment();
        document.getElementById('wp_lat_' + m_id).value = m_waypoint_data.lat().toFixed(5);
        document.getElementById('wp_lng_' + m_id).value = m_waypoint_data.lng().toFixed(5);
        document.getElementById('wp_altitude_' + m_id).value = m_waypoint_data.altitude();

        var select = document.getElementById('wp_type_' + m_id);
        for (t in waypoint_types) {
            var attributes = {value: t};
            if (t == m_waypoint_data.type()) {
                attributes.selected = true;
            }

            html_append_obj_with_text(select, 'option', waypoint_types[t],
                                      attributes);
        }
    }
    /* @} */

    /* Delete the row of this waypoint from the waypoints HTML table. @{ */
    function delete_table_row()
    {
        var tr = document.getElementById('wptr_' + m_id);
        tr.parentNode.removeChild(tr);
    }
    /* @} */

    /* Create a marker on the map for this waypoint. @{ */
    function create_marker(
        /* in,out: map where to add the pointer */
        map)
    {
        m_marker = L.marker(
            [m_waypoint_data.lat(), m_waypoint_data.lng()],
            {
                draggable: true,
                icon: L.icon(
                    {
                        iconAnchor: [7, 7],
                        iconSize: [15, 15],
                        iconUrl: 'img/x-mark-015.png',
                    }
                ),
                title: m_waypoint_data.title(),
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

                m_waypoint_data.set_latlng(ll.lat, ll.lng);
            }
        );

        m_map = map;

        m_marker.addTo(m_map);
    }
    /* @} */

    /* Delete this waypoint's marker from the map. @{ */
    function delete_marker()
    {
        m_map.removeLayer(m_marker);
        m_marker = null;
    }
    /* @} */

    /* Get this waypoint's marker. @{ */
    function marker()
    {
        return(m_marker);
    }
    /* @} */

    /* Update the title of this waypoint's marker. @{
     * Used to regenerate the title after the name or comment of the waypoint
     * has been changed.
     */
    function update_marker_title()
    {
        /* Leaflet does not provide a way to update a marker's title,
         * so we remove the old marker and recreate it.
         */
        if (m_marker != null) {
            delete_marker();
            create_marker(m_map);
        }
    }
    /* @} */

    /* Generate a string that represents one line from a ".dat" file @{ */
    function export_as_dat_line()
    {
        return(m_id + ',' + m_waypoint_data.export_as_part_of_dat_line());
    }
    /* @} */

    /* Export as array. @{ */
    function export_as_array()
    {
        return(m_waypoint_data.export_as_array());
    }
    /* @} */

    /* Export some of the methods as public. @{ */
    return(
        {
            id: id,
            set_id: set_id,
            set_name: set_name,
            set_comment: set_comment,
            create_table_row: create_table_row,
            create_marker: create_marker,
            marker: marker,
            export_as_dat_line: export_as_dat_line,
            export_as_array: export_as_array,
        }
    );
    /* @} */
}
/* @} */

/* Waypoints set (type) @{ */
function waypoints_set_t()
{
    /* Private member variables */

    var m_waypoints = new Array();

    /* Private methods, some of them could be exported below. */

    /* Add a new waypoint to the set. @{ */
    function add(
        /* in: waypoint to add */
        waypoint)
    {
        /* Create a new element and get its index, hoping that this is
         * atomic.
         */
        var i = m_waypoints.push(null) - 1;

        /* Count from 1, rather than from 0 because XCSoar seems to be
         * confused by a waypoint with id=0.
         */
        var id = i + 1;

        m_waypoints[i] = waypoint;
        m_waypoints[i].set_id(id);
        m_waypoints[i].create_table_row();
        m_waypoints[i].create_marker(main_map);
    }
    /* @} */

    /* Delete a waypoint from the set. @{ */
    function del(
        /* in: id of the waypoint to delete */
        waypoint_id)
    {
        for (var i = 0; i < m_waypoints.length; i++) {

            if (m_waypoints[i] != null &&
                m_waypoints[i].id() == waypoint_id) {

                m_waypoints[i] = null;
                break;
            }
        }
    }
    /* @} */

    /* Generate an URL which contains all waypoints' data (share). @{ */
    function gen_url()
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
    /* @} */

    /* Get the generated ".dat" file mime type. @{
     * @return a string representing the mime type
     */
    function dat_mime_type()
    {
        return('application/dat');
    }
    /* @} */

    /* Export as a ".dat" file. @{
     * @return a string that is the file's contents
     */
    function export_as_dat()
    {
        var dat = '';

        for (var i = 0; i < m_waypoints.length; i++) {
            if (m_waypoints[i] != null) {
                dat += m_waypoints[i].export_as_dat_line() + '\n';
            }
        }

        return(dat);
    }
    /* @} */

    /* Export some of the methods as public. @{ */
    return(
        {
            add: add,
            del: del,
            gen_url: gen_url,
            dat_mime_type: dat_mime_type,
            export_as_dat: export_as_dat,
        }
    );
    /* @} */
}
/* @} */

/* @} */

/* Compression/decompression functions @{ */

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

/* @} */

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
    var s = Math.round(ddd * 3600 - d * 3600 - m * 60);

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

    document.getElementById('share_button').onclick =
        function ()
        {
            var url = waypoints.gen_url();

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

    for (var i = 0; i < arr.length; i++) {

        var waypoint = waypoint_t(waypoint_data_t(arr[i]));

        waypoints.add(waypoint);
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

/* vim: set shiftwidth=4 tabstop=4 expandtab foldmethod=marker foldmarker=@{,@}: */
