var turnpoint_types = {
    CYLINDER: 'Cylinder',
    SYMMETRIC_QUADRANT: 'Symmetric quadrant',
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
            if (m_map_shape != null) {
                main_map.removeLayer(m_map_shape);
                m_map_shape = null;
            }
            return;
        }

        var latlng = L.latLng(waypoint.lat(), waypoint.lng());
        if (m_map_shape == null) {
            m_map_shape = L.circle(
                latlng,
                m_radius,
                {
                    weight: 2,
                }
            );
            m_map_shape.addTo(main_map);
        } else {
            m_map_shape.setLatLng(latlng);
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

    /* Set type. @{ */
    function set_type(
        /* in: new type */
        type)
    {
        m_type = turnpoint_types[type] ? type : Object.keys(turnpoint_types)[0];
    }
    /* @} */

    /* Remove this turnpoint's shape from the map. @{ */
    function remove_from_map()
    {
        if (m_map_shape != null) {
            main_map.removeLayer(m_map_shape);
            m_map_shape = null;
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
            set_type: set_type,
            remove_from_map: remove_from_map,
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
            main_map.removeLayer(m_map_path);
            m_map_path = null;
        }

        for (var i = 0; i < m_map_legs_labels.length; i++) {
            main_map.removeLayer(m_map_legs_labels[i]);
        }
        m_map_legs_labels = [];

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

                var label_html =
                    '<span class=\'task_leg_label\'>' +
                    (latlng.distanceTo(prev_latlng) / 1000).toFixed(1) + ' km'
                    '</span>';

                var icon = L.divIcon(
                    {
                        className: 'task_leg_label_wrapper',
                        html: label_html,
                    }
                );

                var marker = L.marker(
                    mid_latlng,
                    {
                        clickable: false,
                        icon: icon,
                        keyboard: false,
                    }
                );

                marker.addTo(main_map);

                m_map_legs_labels.push(marker);
            }

            prev_latlng = latlng;
        }

        if (latlngs.length < 2) {
            return;
        }

        m_map_path = L.polyline(
            latlngs,
            {
                color: 'blue',
                opacity: 1,
                weight: 2,
            }
        );
        m_map_path.addTo(main_map);
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
     * corresponds to this turnpoint is left uninitialized.
     */
    function add_turnpoint(
        /* in: reference <tr>, insertion is done before it */
        ref_tr)
    {
        var turnpoint = turnpoint_t();

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
        tp_name_select.selectedIndex = -1;
        tp_name_select.onchange =
            function ()
            {
                turnpoint.set_waypoint_id(this.options[this.selectedIndex].value);
                redraw_task();
            };

        /* Setup the radius input. */
        var tp_radius_input = tr_data.getElementsByClassName('turnpoint_radius')[0];
        tp_radius_input.onchange =
            function ()
            {
                turnpoint.set_radius(this.value);
            }
        turnpoint.set_radius(tp_radius_input.value);

        /* Setup the type dropdown menu. */
        var tp_type_select = tr_data.getElementsByClassName('turnpoint_type')[0];
        for (t in turnpoint_types) {
            html_append_obj_with_text(
                tp_type_select, "option", turnpoint_types[t], { value: t });
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

        ref_tr.parentNode.insertBefore(tr_data, ref_tr);
        /* Workaround an issue in Chrome: selectedIndex gets reset from -1
         * to 0 by the insertBefore() call. tp_name_select is a child of
         * tr_data.
         */
        tp_name_select.selectedIndex = -1;
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

    /* Export some of the methods as public. @{ */
    return(
        {
            add_turnpoint: add_turnpoint,
            redraw_task: redraw_task,
            refresh_after_waypoint_add: refresh_after_waypoint_add,
            refresh_after_waypoint_del: refresh_after_waypoint_del,
            refresh_after_waypoint_rename: refresh_after_waypoint_rename,
        }
    );
    /* @} */
}
/* @} */

/* vim: set shiftwidth=4 tabstop=4 expandtab foldmethod=marker foldmarker=@{,@}: */
