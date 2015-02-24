var waypoint_types = {
    T: 'Turnpoint',
    L: 'Landable',
    TH: 'Turnpoint (Home)',
    ATL: 'Airport',
};

/* Basic data fields of a waypoint (type) @{ */
function waypoint_data_t(
    /* in: parameters object or array, must contain:
     * - id or [0]: waypoint id [number]
     * - lat or [1]: fractional number d.ddddd [degrees]
     * - lng or [2]: fractional number d.ddddd [degrees]
     * - altitude or [3]: integer altitude [meters]
     * - type or [4]: string, one of waypoint_types' keys
     * - name or [5]: name of the waypoint
     * - comment or [6]: waypoint comment
     */
    data)
{
    /* Private member variables */

    var m_id;
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
        m_id = p.id;

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
                id: arr[0],
                lat: arr[1],
                lng: arr[2],
                altitude: arr[3],
                type: arr[4],
                name: arr[5],
                comment: arr[6],
            }
        );
    }
    /* @} */

    /* Get id. @{ */
    function id()
    {
        return(m_id);
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
        m_name = name ? name : 'wp' + m_id;
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
                m_id,
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

    /* Export as a ".dat" line. @{ */
    function export_as_dat_line()
    {
        return(
            m_id + ',' +
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
            id: id,
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
            export_as_dat_line: export_as_dat_line,
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

    var m_waypoint_data = waypoint_data;
    var m_marker;
    var m_map;

    /* Private methods, some of them could be exported below. */

    /* Get the id of the waypoint. @{ */
    function id()
    {
        return(m_waypoint_data.id());
    }
    /* @} */

    /* Get the latitude of the waypoint. @{ */
    function lat()
    {
        return(m_waypoint_data.lat());
    }
    /* @} */

    /* Get the longtitude of the waypoint. @{ */
    function lng()
    {
        return(m_waypoint_data.lng());
    }
    /* @} */

    /* Get the altitude of the waypoint. @{ */
    function altitude()
    {
        return(m_waypoint_data.altitude());
    }
    /* @} */

    /* Set/change the name of the waypoint. @{ */
    function set_name(
        /* in: new name */
        name)
    {
        m_waypoint_data.set_name(name);

        update_marker_title();

        task.refresh_after_waypoint_rename(m_waypoint_data.id());
    }
    /* @} */

    /* Get the name of the waypoint. @{ */
    function name()
    {
        return(m_waypoint_data.name());
    }
    /* @} */

    /* Set/change the comment of the waypoint. @{ */
    function set_comment(
        /* in: new comment */
        comment)
    {
        m_waypoint_data.set_comment(comment);

        update_marker_title();

        task.refresh_after_waypoint_rename(m_waypoint_data.id());
    }
    /* @} */

    /* Get the comment of the waypoint. @{ */
    function comment()
    {
        return(m_waypoint_data.comment());
    }
    /* @} */

    /* Get the title of the waypoint. @{ */
    function title()
    {
        return(m_waypoint_data.title());
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
        tr_inner = tr_inner.replace(/{([^}]+)}/g, '$1' + m_waypoint_data.id());

        var tr = document.createElement('tr');
        tr.setAttribute('id', 'wptr_' + m_waypoint_data.id());
        tr.innerHTML = tr_inner;

        var new_waypoint_tr = document.getElementById('new_waypoint_tr');
        new_waypoint_tr.parentNode.insertBefore(tr, new_waypoint_tr);

        var wp_lat = document.getElementById('wp_lat_' + m_waypoint_data.id());
        var wp_lng = document.getElementById('wp_lng_' + m_waypoint_data.id());
        wp_lat.onchange =
        wp_lng.onchange =
            function ()
            {
                m_waypoint_data.set_latlng(wp_lat.value, wp_lng.value);
                m_marker.setLatLng([wp_lat.value, wp_lng.value]);
                task.redraw_task();
            }

        document.getElementById('wp_altitude_' + m_waypoint_data.id()).onchange =
            function ()
            {
                m_waypoint_data.set_altitude(this.value);
            }

        document.getElementById('wp_type_' + m_waypoint_data.id()).onchange =
            function ()
            {
                m_waypoint_data.set_type(this.value);
            }

        document.getElementById('wp_name_' + m_waypoint_data.id()).onchange =
            function ()
            {
                set_name(this.value);
            }

        document.getElementById('wp_comment_' + m_waypoint_data.id()).onchange =
            function ()
            {
                set_comment(this.value);
            }

        document.getElementById('wp_del_' + m_waypoint_data.id()).onclick =
            function ()
            {
                delete_marker();

                delete_table_row();

                waypoints.del(m_waypoint_data.id());
            }

        document.getElementById('wp_name_' + m_waypoint_data.id()).value = m_waypoint_data.name();
        document.getElementById('wp_comment_' + m_waypoint_data.id()).value = m_waypoint_data.comment();
        document.getElementById('wp_lat_' + m_waypoint_data.id()).value = m_waypoint_data.lat().toFixed(5);
        document.getElementById('wp_lng_' + m_waypoint_data.id()).value = m_waypoint_data.lng().toFixed(5);
        document.getElementById('wp_altitude_' + m_waypoint_data.id()).value = m_waypoint_data.altitude();

        var select = document.getElementById('wp_type_' + m_waypoint_data.id());
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
        var tr = document.getElementById('wptr_' + m_waypoint_data.id());
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
                document.getElementById('wp_name_' + m_waypoint_data.id()).focus();

                /* Shake the whole table row */
                var tr = document.getElementById('wptr_' + m_waypoint_data.id());
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

                document.getElementById('wp_lat_' + m_waypoint_data.id()).value = ll.lat.toFixed(5);
                document.getElementById('wp_lng_' + m_waypoint_data.id()).value = ll.lng.toFixed(5);

                m_waypoint_data.set_latlng(ll.lat, ll.lng);

                task.redraw_task();
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
        return(m_waypoint_data.export_as_dat_line());
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
            lat: lat,
            lng: lng,
            altitude: altitude,
            set_name: set_name,
            name: name,
            set_comment: set_comment,
            comment: comment,
            title: title,
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
        var existent_waypoint = get_by_id(waypoint.id());
        if (existent_waypoint != null) {
            alert('Cannot add a new waypoint "' + waypoint.name() + '" ' +
                  'because a waypoint with the same id ' + waypoint.id() + ' ' +
                  'already exists: "' + existent_waypoint.name() + '"');
            return;
        }

        m_waypoints.push(waypoint);

        waypoint.create_table_row();
        waypoint.create_marker(main_map);

        task.refresh_after_waypoint_add(waypoint);
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

                task.refresh_after_waypoint_del(waypoint_id);

                break;
            }
        }
    }
    /* @} */

    /* Import the waypoints from an array. @{ */
    function import_from_array(
        /* in: array with data */
        arr)
    {
        for (var i = 0; i < arr.length; i++) {

            var waypoint = waypoint_t(waypoint_data_t(arr[i]));

            add(waypoint);
        }
    }
    /* @} */

    /* Export as an array. @{ */
    function export_as_array()
    {
        var arr = new Array();

        for (var i = 0; i < m_waypoints.length; i++) {
            if (m_waypoints[i] != null) {
                arr.push(m_waypoints[i].export_as_array());
            }
        }

        return(arr);
    }
    /* @} */

    /* Generate a ".dat" file. @{
     * @return a string that is the file's contents
     */
    function gen_dat()
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

    /* Save the waypoints as a file on the user's computer. @{ */
    function save()
    {
        var dat_str = gen_dat();
        save_str_as_file(dat_str, "waypoints.dat");
    }
    /* @} */

    /* Get a waypoint from the set, given its id. @{
     * @return the waypoint object or null if not found
     */
    function get_by_id(
        /* in: id of the searched waypoint */
        id)
    {
        for (var i = 0; i < m_waypoints.length; i++) {
            if (m_waypoints[i] == null) {
                continue;
            }

            if (m_waypoints[i].id() == id) {
                return(m_waypoints[i])
            }
        }
        return(null);
    }
    /* @} */

    /* Generate a new waypoint id that is unique in this set. @{
     * @return a unique id
     */
    function gen_new_id()
    {
        /* Count from 1, rather than from 0 because XCSoar seems to be
         * confused by a waypoint with id=0.
         */
        var id = 1;

        /* Generate a new id that is the max id + 1, or just 1 if the
         * array is empty.
         */
        for (var i = 0; i < m_waypoints.length; i++) {
            var cur_id = Number(m_waypoints[i].id());
            if (id <= cur_id) {
                id = cur_id + 1;
            }
        }
        return(id);
    }
    /* @} */

    /* Export some of the methods as public. @{ */
    return(
        {
            add: add,
            del: del,
            load_from_url: load_from_url,
            export_as_array: export_as_array,
            import_from_array: import_from_array,
            save: save,
            get_by_id: get_by_id,
            gen_new_id: gen_new_id,
        }
    );
    /* @} */
}
/* @} */

/* vim: set shiftwidth=4 tabstop=4 expandtab foldmethod=marker foldmarker=@{,@}: */
