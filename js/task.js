var turnpoint_types = {
    Cylinder: 'Cylinder',
    SymmetricQuadrant: 'Symmetric quadrant',
};

/* Turnpoint (type). @{
 * A turnpoint consists of a waypoint + radius and turnpoint type.
 */
function turnpoint_t()
{
    /* Private member variables. */

    var m_waypoint_id = -1;
    var m_radius;
    var m_type;
    var m_map_shape = null;

    /* Redraw this turnpoint's shape on the map. @{ */
    function redraw_turnpoint()
    {
        var waypoint = waypoints.get_by_id(m_waypoint_id);

        /* If no waypoint is set. */
        if (waypoint == null) {
            /* Remove an outdated shape from the map, if any. */
            remove_from_map();
            return;
        }

        var latlng = L.latLng(waypoint.lat(), waypoint.lng());
        if (m_map_shape == null) {
            m_map_shape = map_circle_t({
                lat: waypoint.lat(),
                lng: waypoint.lng(),
                radius: m_radius,
                contour_width: 2,
            });
            map.add_shape(m_map_shape);
        } else {
            m_map_shape.setLatLng(latlng); /* XXX direct access to leaflet */
        }
    }
    /* @} */

    /* Set waypoint id. @{ */
    function set_waypoint_id(
        /* in: id of the new waypoint this turnpoint will be linked with. */
        waypoint_id)
    {
        m_waypoint_id = waypoint_id;

        redraw_turnpoint();
    }
    /* @} */

    /* Get waypoint id. @{ */
    function waypoint_id()
    {
        return(m_waypoint_id);
    }
    /* @} */

    /* Set radius. @{ */
    function set_radius(
        /* in: new radius */
        radius)
    {
        m_radius = radius;

        if (m_map_shape != null) {
            m_map_shape.setRadius(m_radius);
        }
    }
    /* @} */

    /* Get radius. @{ */
    function radius()
    {
        return(m_radius);
    }
    /* @} */

    /* Set type. @{ */
    function set_type(
        /* in: new type */
        type)
    {
        m_type = turnpoint_types[type] ? type : Object.keys(turnpoint_types)[0];
    }
    /* @} */

    /* Get type. @{ */
    function type()
    {
        return(m_type);
    }
    /* @} */

    /* Remove this turnpoint's shape from the map. @{ */
    function remove_from_map()
    {
        if (m_map_shape != null) {
            map.delete_shape(m_map_shape);
            m_map_shape = null;
        }
    }
    /* @} */

    /* Export this turnpoint's data as an array. @{
     * @return an array that can be passed to import_from_array()
     */
    function export_as_array()
    {
        return(
            [
                m_waypoint_id,
                m_radius,
                m_type,
            ]
        );
    }
    /* @} */

    /* Import the data from an array, returned by export_as_array(). @{ */
    function import_from_array(
        /* in: array that contains the data. */
        arr)
    {
        /* Avoid calling set_waypoint_id() and set_radius() because they try
         * to redraw the turnpoint.
         */
        m_waypoint_id = arr[0];
        m_radius = arr[1];
        set_type(arr[2]);
    }
    /* @} */

    /* Get the bounds of the turnpoint's shape on the map. @{ */
    function bounds()
    {
        if (m_map_shape != null) {
            return(m_map_shape.getBounds());
        } else {
            return(null);
        }
    }
    /* @} */

    /* Export some of the methods as public. @{ */
    return(
        {
            redraw_turnpoint: redraw_turnpoint,
            set_waypoint_id: set_waypoint_id,
            waypoint_id: waypoint_id,
            set_radius: set_radius,
            radius: radius,
            set_type: set_type,
            type: type,
            remove_from_map: remove_from_map,
            export_as_array: export_as_array,
            import_from_array: import_from_array,
            bounds: bounds,
        }
    );
    /* @} */
}
/* @} */

/* Task (type). @{ */
function task_t()
{
    /* Private member variables. */

    var m_turnpoints = new Array();
    var m_map_path = null;
    var m_map_legs_labels = new Array();

    /* Redraw the task on the map. @{ */
    function redraw_task()
    {
        /* Remove the existent task elements from the map. */
        if (m_map_path != null) {
            map.delete_shape(m_map_path);
            m_map_path = null;
        }

        for (var i = 0; i < m_map_legs_labels.length; i++) {
            map.delete_shape(m_map_legs_labels[i]);
        }
        m_map_legs_labels = [];

        document.getElementById('task_summary_div').innerHTML = '';

        var total_distance_m = 0;

        var latlngs = new Array();
        var prev_latlng = null;
        for (var i = 0; i < m_turnpoints.length; i++) {

            var turnpoint = m_turnpoints[i];
            var waypoint = waypoints.get_by_id(turnpoint.waypoint_id());

            if (waypoint == null) {
                continue;
            }

            turnpoint.redraw_turnpoint();

            var latlng = L.latLng(waypoint.lat(), waypoint.lng());

            latlngs.push(latlng);

            if (prev_latlng != null) {

                var mid_latlng = coord_find_middle(
                    latlng.lat, latlng.lng,
                    prev_latlng.lat, prev_latlng.lng);

                var leg_length_m = latlng.distanceTo(prev_latlng);

                total_distance_m += leg_length_m;

                var label_html =
                    '<span class=\'task_leg_label\'>' +
                    (leg_length_m / 1000).toFixed(1) + ' km'
                    '</span>';

                var icon = map_html_icon_t(
                    {
                        class_name: 'task_leg_label_wrapper',
                        html: label_html,
                    }
                );

                var marker = map_marker_t(
                    {
                        clickable: false,
                        draggable: false,
                        icon: icon,
                        keyboard: false,
                        lat: mid_latlng[0],
                        lng: mid_latlng[1],
                        onclick: null,
                        ondrag: null,
                        title: "",
                    }
                );

                map.add_shape(marker);

                m_map_legs_labels.push(marker);
            }

            prev_latlng = latlng;
        }

        if (latlngs.length < 2) {
            return;
        }

        m_map_path = map_polyline_t({
            color: 'blue',
            opacity: 1,
            points: latlngs,
            width: 2,
        });

        map.add_shape(m_map_path);

        document.getElementById('task_summary_div').innerHTML =
            'Total distance: ' +
            (total_distance_m / 1000).toFixed(1) + ' km';
    }
    /* @} */

    /* Calculate how many turnpoints are before a given <tr>. @{ */
    function n_turnpoints_before(
        /* in: insert or data <tr> (both will work) */
        tr)
    {
        var pos = 0;
        for (var i = 0; i < tr.parentNode.children.length; i++) {
            var child = tr.parentNode.children[i];
            if (tr == child) {
                break;
            }
            if (child.getAttribute('turnpoint_data_row')) {
                pos++;
            }
        }
        return(pos);
    }
    /* @} */

    /* Add a new turnpoint to the task. @{
     * Create a new <tr>s for the new turnpoint and insert a new element
     * in m_turnpoints[] to the correct position. The waypoint that
     * corresponds to this turnpoint is left uninitialized if the second
     * argument is not given.
     */
    function add_turnpoint(
        /* in: reference <tr>, insertion is done before it */
        ref_tr,
        /* in: optional, array to import the turnpoint data from */
        arr)
    {
        var turnpoint = turnpoint_t();
        var turnpoint_has_data = false;

        if (arr) {
            turnpoint.import_from_array(arr);
            turnpoint_has_data = true;
        }

        /* Find the position in m_turnpoints[] to insert the new turnpoint.
         * Since rows can be inserted in the middle of the table, we must
         * also insert in the middle of the array, obeying the same order
         * of the turnpoints in the HTML table and in m_turnpoints[].
         */
        var pos = n_turnpoints_before(ref_tr);

        m_turnpoints.splice(pos, 0, turnpoint);

        /* Create the 'insert new turnpoint' row. */

        var tr_ins_inner = document.getElementById('turnpoint_insert_template_tr').innerHTML;

        var tr_ins = document.createElement('tr');
        tr_ins.innerHTML = tr_ins_inner;

        /* Setup the 'add new turnpoint' event. */
        tr_ins.getElementsByClassName('turnpoint_add')[0].onclick =
            function ()
            {
                task.add_turnpoint(this.parentNode);
            };

        ref_tr.parentNode.insertBefore(tr_ins, ref_tr);

        /* Create the data fields row. */

        var tr_data_inner = document.getElementById('turnpoint_data_template_tr').innerHTML;

        var tr_data = document.createElement('tr');
        tr_data.setAttribute('turnpoint_data_row', true);
        tr_data.innerHTML = tr_data_inner;

        /* Setup the name dropdown menu. */
        var tp_name_select = tr_data.getElementsByClassName('turnpoint_name')[0];
        tp_name_select.onchange =
            function ()
            {
                turnpoint.set_waypoint_id(this.options[this.selectedIndex].value);
                redraw_task();
            };
        var selected_index = -1;
        if (turnpoint_has_data) {
            /* For all <option>s in tp_name_select. */
            var options = tp_name_select.getElementsByTagName('option');
            for (var i = 0; i < options.length; i++) {
                if (options[i].value == turnpoint.waypoint_id()) {
                    selected_index = i;
                    break;
                }
            }
        }
        tp_name_select.selectedIndex = selected_index;

        /* Setup the radius input. */
        var tp_radius_input = tr_data.getElementsByClassName('turnpoint_radius')[0];
        tp_radius_input.onchange =
            function ()
            {
                turnpoint.set_radius(this.value);
            };
        if (turnpoint_has_data) {
            /* tp_radius_input.value has a preset value of 1000 from the
             * HTML template. Reset it to whatever is given by the caller.
             */
            tp_radius_input.value = turnpoint.radius();
        } else {
            /* Set the radius using the preset 1000 from the HTML template. */
            turnpoint.set_radius(tp_radius_input.value);
        }

        /* Setup the type dropdown menu. */
        var tp_type_select = tr_data.getElementsByClassName('turnpoint_type')[0];
        selected_index = 0;
        var i = 0;
        for (t in turnpoint_types) {
            html_append_obj_with_text(
                tp_type_select, "option", turnpoint_types[t], { value: t });

            if (turnpoint_has_data && turnpoint.type() == t) {
                selected_index = i;
            }
            i++;
        }
        tp_type_select.selectedIndex = selected_index;
        tp_type_select.onchange =
            function ()
            {
                turnpoint.set_type(this.options[this.selectedIndex].value);
            };
        if (!turnpoint_has_data) {
            /* Use the first type by default if the caller did not provide one. */
            turnpoint.set_type(Object.keys(turnpoint_types)[0]);
        }

        /* Setup the delete action. */
        tr_data.getElementsByClassName('turnpoint_del')[0].onclick =
            function ()
            {
                var data_tr = this.parentNode;
                var ins_tr = data_tr.previousElementSibling;

                var pos = n_turnpoints_before(data_tr);
                m_turnpoints[pos].remove_from_map();
                m_turnpoints.splice(pos, 1);

                redraw_task();

                var p = data_tr.parentNode;
                p.removeChild(data_tr);
                p.removeChild(ins_tr);
            };

        var none_was_selected = tp_name_select.selectedIndex == -1;

        ref_tr.parentNode.insertBefore(tr_data, ref_tr);
        /* Workaround an issue in Chrome: selectedIndex gets reset from -1
         * to 0 by the insertBefore() call. tp_name_select is a child of
         * tr_data.
         */
        if (none_was_selected) {
            tp_name_select.selectedIndex = -1;
        }
    }
    /* @} */

    /* Add a newly added waypoint's title to the name <select>s. @{ */
    function refresh_after_waypoint_add(
        /* in: newly added waypoint object */
        added_waypoint)
    {
        var task_table = document.getElementById('task_table');
        /* All HTML <select> elements for waypoint names. */
        var name_selects = task_table.getElementsByClassName('turnpoint_name');

        /* For all <select>s for waypoint names. */
        for (var i = 0; i < name_selects.length; i++) {
            var cur_select = name_selects[i];

            var none_was_selected = cur_select.selectedIndex == -1;

            html_append_obj_with_text(
                cur_select, "option", added_waypoint.title(),
                { value: added_waypoint.id() }
            );

            /* Reset back to -1 because the append sets it to 0
             * if it was -1.
             */
            if (none_was_selected) {
                cur_select.selectedIndex = -1;
            }
        }
    }
    /* @} */

    /* Delete a waypoint from the name <select>s. @{
     * Also select-none if the deleted waypoint has been selected in some
     * of the <select>s.
     */
    function refresh_after_waypoint_del(
        /* in: deleted waypoint id */
        waypoint_id)
    {
        var task_table = document.getElementById('task_table');
        /* All HTML <select> elements for waypoint names. */
        var name_selects = task_table.getElementsByClassName('turnpoint_name');

        /* For all <select>s for waypoint names. */
        for (var i = 0; i < name_selects.length; i++) {
            var cur_select = name_selects[i];
            var cur_select_options = cur_select.getElementsByTagName('option');
            /* For all <option>s in each <select>. */
            for (var j = 0; j < cur_select_options.length; j++) {
                var cur_option = cur_select_options[j];

                /* Delete the <option> if it points to the deleted waypoint. */
                if (cur_option.value == waypoint_id) {
                    /* If the to-be-deleted <option> is the currently selected
                     * one, then deselect it and select none. If we assign
                     * selectedIndex = -1 here then the below removeChild()
                     * resets selectedIndex to 0, thus we defer the assignment
                     * for after the removeChild() call. The check
                     * selectedIndex == j cannot be performed after the
                     * deletion because then the removal of an element causes
                     * all indexes, including selectedIndex, to shift.
                     */
                    var selected_deleted = cur_select.selectedIndex == j;
                    var none_was_selected = cur_select.selectedIndex == -1;

                    cur_select.removeChild(cur_option);

                    /* removeChild() resets selectedIndex from -1 to 0. */
                    if (none_was_selected) {
                        cur_select.selectedIndex = -1;
                    }

                    if (selected_deleted) {
                        cur_select.selectedIndex = -1;

                        /* <tr><td><select> */
                        var pos = n_turnpoints_before(cur_select.parentNode.parentNode);
                        m_turnpoints[pos].remove_from_map();
                    }

                    /* Only one <option> could be with the given waypoint_id
                     * in one <select>, so don't bother with the rest of the
                     * <options> in this <select> and continue with the next.
                     */
                    break;
                }
            }
        }

        redraw_task();
    }
    /* @} */

    /* Rename a waypoint in the name <select>s. @{ */
    function refresh_after_waypoint_rename(
        /* in: renamed waypoint id */
        waypoint_id)
    {
        var task_table = document.getElementById('task_table');
        /* All HTML <select> elements for waypoint names. */
        var name_selects = task_table.getElementsByClassName('turnpoint_name');

        /* For all <select>s for waypoint names. */
        for (var i = 0; i < name_selects.length; i++) {
            var cur_select = name_selects[i];
            var cur_select_options = cur_select.getElementsByTagName('option');
            /* For all <option>s in each <select>. */
            for (var j = 0; j < cur_select_options.length; j++) {
                var cur_option = cur_select_options[j];

                if (cur_option.value == waypoint_id) {
                    cur_option.innerHTML = waypoints.get_by_id(waypoint_id).title();
                    break;
                }
            }
        }
    }
    /* @} */

    /* Export the whole task as an array. @{
     * @return an array that can be passed to import_from_array()
     */
    function export_as_array()
    {
        var arr = new Array();

        for (var i = 0; i < m_turnpoints.length; i++) {
            arr.push(m_turnpoints[i].export_as_array());
        }

        return(arr);
    }
    /* @} */

    /* Import the task's data from an array, returned by export_as_array() @{ */
    function import_from_array(
        /* in: array with data */
        arr)
    {
        var ins_tr = document.getElementById('turnpoint_insert_last_td').parentNode;
        for (var i = 0; i < arr.length; i++) {
            add_turnpoint(ins_tr, arr[i]);
        }
        redraw_task();
    }
    /* @} */

    /* Check if the task is valid (has more than 1 turnpoint). @{
     * @return true if valid
     */
    function is_valid()
    {
        return(m_turnpoints.length >= 2);
    }
    /* @} */

    /* Generate a ".tsk" file. @{
     * @return an object, containing the string and the suggested file name
     */
    function gen_tsk()
    {
        var tsk_str = '';

        tsk_str +=
            '<Task ' +
            'fai_finish="0" ' +
            'finish_min_height_ref="AGL" ' +
            'finish_min_height="0" ' +
            'start_max_height_ref="AGL" ' +
            'start_max_height="0" ' +
            'start_max_speed="0" ' +
            'start_requires_arm="0" ' +
            'aat_min_time="10800" ' +
            'type="RT">\n';

        var file_name = 'empty-task';

        for (var i = 0; i < m_turnpoints.length; i++) {

            var turnpoint = m_turnpoints[i];
            var waypoint = waypoints.get_by_id(turnpoint.waypoint_id());

            if (waypoint == null) {
                continue;
            }

            var point_type;

            switch (i) {
            case 0:
                point_type = 'Start';
                file_name = waypoint.name();
                break;
            case m_turnpoints.length - 1:
                point_type = 'Finish';
                file_name += '-' + waypoint.name();
                break;
            default:
                point_type = 'Turn';
            }

            tsk_str +=
                '\t<Point type="' + point_type + '">\n' +

                '\t\t<Waypoint ' +
                'altitude="' + waypoint.altitude() + '" ' +
                'comment="' + waypoint.comment() + '" ' +
                'id="' + turnpoint.waypoint_id() + '" ' +
                'name="' + waypoint.name() + '">\n' +

                '\t\t\t<Location ' +
                'latitude="' + waypoint.lat().toFixed(4) + '" ' +
                'longitude="' + waypoint.lng().toFixed(4) + '"/>\n' +

                '\t\t</Waypoint>\n' +
                '\t\t<ObservationZone ' +
                'radius="' + turnpoint.radius() + '" ' +
                'type="' + turnpoint.type() + '"/>\n' +
                '\t</Point>\n';
        }

        tsk_str += '</Task>\n';

        file_name += '.tsk';

        return(
            {
                str: tsk_str,
                file_name: file_name,
            }
        );
    }
    /* @} */

    /* Save the task as a .tsk file on the user's computer. @{ */
    function save()
    {
        var tsk = gen_tsk();
        save_str_as_file(tsk.str, tsk.file_name);
    }
    /* @} */

    /* Get the max waypoint id from all turnpoints in the task. @{
     * @return max waypoint id or -1 if there are no turnpoints
     */
    function max_waypoint_id()
    {
        var max_id = -1;
        for (var i = 0; i < m_turnpoints.length; i++) {
            max_id = Math.max(max_id, m_turnpoints[i].waypoint_id());
        }
        return(max_id);
    }
    /* @} */

    /* Fit map's viewport to the task. @{ */
    function fit_map()
    {
        if (!is_valid()) {
            return;
        }

        var bounds = m_map_path.getBounds();
        for (var i = 0; i < m_turnpoints.length; i++) {
            bounds.extend(m_turnpoints[i].bounds());
        }

        main_map.fitBounds(bounds);
    }
    /* @} */

    /* Export some of the methods as public. @{ */
    return(
        {
            add_turnpoint: add_turnpoint,
            redraw_task: redraw_task,
            refresh_after_waypoint_add: refresh_after_waypoint_add,
            refresh_after_waypoint_del: refresh_after_waypoint_del,
            refresh_after_waypoint_rename: refresh_after_waypoint_rename,
            export_as_array: export_as_array,
            import_from_array: import_from_array,
            is_valid: is_valid,
            save: save,
            max_waypoint_id: max_waypoint_id,
            fit_map: fit_map,
        }
    );
    /* @} */
}
/* @} */

/* vim: set shiftwidth=4 tabstop=4 expandtab foldmethod=marker foldmarker=@{,@}: */
