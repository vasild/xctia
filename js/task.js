/*
Copyright (c) 2014-2015, Vasil Dimov, http://xctia.org.
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
    function redraw_turnpoint(
        /* in: previous turnpoint or null if this is the first one */
        prev_turnpoint,
        /* in: next turnpoint or null if this is the last one */
        next_turnpoint)
    {
        var waypoint = waypoints.get_by_id(m_waypoint_id);

        /* If no waypoint is set. */
        if (waypoint == null) {
            /* Remove an outdated shape from the map, if any. */
            remove_from_map();
            return;
        }

        if (m_map_shape == null) {
            m_map_shape = map_circle_t({
                lat: waypoint.lat(),
                lng: waypoint.lng(),
                radius: m_radius,
                contour_width: 2,
            });

            map.add_shape(m_map_shape);
        } else {
            m_map_shape.set_location([waypoint.lat(), waypoint.lng()]);
        }

        switch (m_type) {
        case 'Cylinder':
            /* Convert to full circle in case it was semicircle before. */
            m_map_shape.set_semicircle(0, 0);
            break;
        case 'SymmetricQuadrant':
            var angle_deg;

            if (prev_turnpoint != null && next_turnpoint != null) {
                var prev_waypoint = waypoints.get_by_id(prev_turnpoint.waypoint_id());
                var next_waypoint = waypoints.get_by_id(next_turnpoint.waypoint_id());

                angle_deg = coord_bisector_angle(
                    prev_waypoint.lat(), prev_waypoint.lng(),
                    waypoint.lat(), waypoint.lng(),
                    next_waypoint.lat(), next_waypoint.lng());

            } else if (prev_turnpoint != null) {
                /* next_turnpoint is null, this is the last */
                var prev_waypoint = waypoints.get_by_id(prev_turnpoint.waypoint_id());

                angle_deg = coord_vector_angle_from_y(
                    prev_waypoint.lat(), prev_waypoint.lng(),
                    waypoint.lat(), waypoint.lng());

            } else if (next_turnpoint != null) {
                /* prev_turnpoint is null, this is the first */
                var next_waypoint = waypoints.get_by_id(next_turnpoint.waypoint_id());

                angle_deg = coord_vector_angle_from_y(
                    waypoint.lat(), waypoint.lng(),
                    next_waypoint.lat(), next_waypoint.lng());

                angle_deg += 180;

            } else {
                /* It is a sole turnpoint. Point the semicircle to the north. */
                angle_deg = 0;
            }

            m_map_shape.set_semicircle(angle_deg, 90);

            break;
        }
    }
    /* @} */

    /* Set waypoint id. @{ */
    function set_waypoint_id(
        /* in: id of the new waypoint this turnpoint will be linked with. */
        waypoint_id)
    {
        m_waypoint_id = waypoint_id;
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
            m_map_shape.set_radius(m_radius);
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
            return(m_map_shape.bounds());
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

    /* Get the index of a turnpoint in m_turnpoints[] from a row in the task table. @{
     * @return index of the turnpoint in m_turnpoints[]
     */
    function turnpoint_row_get_index_in_array(
        /* in: row in the HTML task table */
        row)
    {
        return(row.getElementsByTagName('div')[0].getAttribute('turnpoint-index'));
    }
    /* @} */

    /* Set the index from m_turnpoints[] of a turnpoint in a row in the task table. @{ */
    function turnpoint_row_set_index_in_array(
        /* in: row in the HTML task table. */
        row,
        /* in: index of the turnpoint in m_turnpoints[] */
        index)
    {
        row.getElementsByTagName('div')[0].setAttribute('turnpoint-index', index);
    }
    /* @} */

    /* Get the turnpoint object from m_turnpoints[] from a row in the task table. @{
     * @return turnpoint object
     */
    function get_turnpoint_from_row(
        /* in: row in the HTML task table. */
        row)
    {
        var i = turnpoint_row_get_index_in_array(row);
        return(m_turnpoints[i]);
    }
    /* @} */

    /* Get a HTMLCollection of all rows in the HTML task table. @{
     * @return HTMLCollection of all rows
     */
    function get_rows()
    {
        return(document.getElementById('turnpoints_div').getElementsByClassName('turnpoint_row'));
    }
    /* @} */

    /* Decrement some rows' turnpoint index. @{
     * For rows that have a turnpoint index greater than the specified one -
     * decrement them with one. This is used after an entry is deleted from
     * m_turnpoints[] to bring the references in the table rows back in sync.
     */
    function rows_dec_array_indexes_after_del(
        /* in: array in m_turnpoints[] of the deleted turnpoint. */
        array_deleted_index)
    {
        var rows = get_rows();
        for (var i = 0; i < rows.length; i++) {
            array_index = turnpoint_row_get_index_in_array(rows[i]);
            if (array_index > array_deleted_index) {
                turnpoint_row_set_index_in_array(rows[i], array_index - 1);
            }
        }
    }
    /* @} */

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
        var rows = get_rows();
        for (var i = 0; i < rows.length; i++) {

            var turnpoint = get_turnpoint_from_row(rows[i]);
            var waypoint = waypoints.get_by_id(turnpoint.waypoint_id());

            if (waypoint == null) {
                continue;
            }

            /* Find the first turnpoint before the current one that has
             * a valid waypoint.
             */
            var prev_turnpoint = null;
            for (var j = i - 1; j >= 0; j--) {
                var t = get_turnpoint_from_row(rows[j]);
                var w = waypoints.get_by_id(t.waypoint_id());
                if (w) {
                    prev_turnpoint = t;
                    break;
                }
            }

            /* Find the first turnpoint after the current one that has
             * a valid waypoint.
             */
            var next_turnpoint = null;
            for (var j = i + 1; j < rows.length; j++) {
                var t = get_turnpoint_from_row(rows[j]);
                var w = waypoints.get_by_id(t.waypoint_id());
                if (w) {
                    next_turnpoint = t;
                    break;
                }
            }

            turnpoint.redraw_turnpoint(prev_turnpoint, next_turnpoint);

            var latlng = map_latlng_t(waypoint.lat(), waypoint.lng());

            latlngs.push(latlng);

            if (prev_latlng != null) {

                var mid_latlng = coord_find_middle(
                    latlng.lat(), latlng.lng(),
                    prev_latlng.lat(), prev_latlng.lng());

                var leg_length_m = latlng.distance_to(prev_latlng);

                total_distance_m += leg_length_m;

                var label_html =
                    '<span class=\'task_leg_label\'>' +
                    (leg_length_m / 1000).toFixed(1) + ' km'
                    '</span>';

                var marker = map_marker_t(
                    {
                        clickable: false,
                        draggable: false,
                        icon: map_html_icon_t({
                            class_name: 'task_leg_label_wrapper',
                            html: label_html,
                        }),
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

    /* Add a new turnpoint to the task. @{
     * Create a new row for the new turnpoint and append a new element
     * in m_turnpoints[]. The waypoint that corresponds to this turnpoint
     * is left uninitialized if the argument is not given.
     */
    function add_turnpoint(
        /* in: optional, array to import the turnpoint data from */
        arr)
    {
        var turnpoint = turnpoint_t();
        var turnpoint_has_data = false;

        if (arr) {
            turnpoint.import_from_array(arr);
            turnpoint_has_data = true;
        }

        /* Make the task elements visible if this is the first added point. */
        if (m_turnpoints.length == 0) {
            document.getElementById('turnpoints_heading_div').classList.remove('invisible');
            document.getElementById('task_summary_div').classList.remove('invisible');
        }

        /* Create the turnpoint row. */

        var row = document.createElement('div');
        row.innerHTML = document.getElementById('turnpoint_row_template_div').innerHTML;
        row.classList.add('turnpoint_row');
        row.classList.add('uk-grid');
        row.classList.add('uk-grid-collapse');
        row.classList.add('uk-text-center');

        var turnpoint_index = m_turnpoints.push(turnpoint) - 1;

        turnpoint_row_set_index_in_array(row, turnpoint_index);

        /* Setup the name dropdown menu. */
        var tp_name_select = row.getElementsByClassName('turnpoint_name')[0];
        tp_name_select.onchange =
            function ()
            {
                turnpoint.set_waypoint_id(this.options[this.selectedIndex].value);
                redraw_task();
                regen_url_hash();
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
        var tp_radius_input = row.getElementsByClassName('turnpoint_radius')[0];
        tp_radius_input.onchange =
            function ()
            {
                turnpoint.set_radius(this.value);
                regen_url_hash();
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
        var tp_type_select = row.getElementsByClassName('turnpoint_type')[0];
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
                redraw_task();
                regen_url_hash();
            };
        if (!turnpoint_has_data) {
            /* Use the first type by default if the caller did not provide one. */
            turnpoint.set_type(Object.keys(turnpoint_types)[0]);
        }

        /* Setup the delete action. */
        row.getElementsByClassName('turnpoint_del')[0].onclick =
            function ()
            {
                /* <div><div><span class="turnpoint_del">
                 * the parent of the parent of the span is the row.
                 */
                var tp_row = this.parentNode.parentNode;

                var i = turnpoint_row_get_index_in_array(tp_row);
                m_turnpoints[i].remove_from_map();
                m_turnpoints.splice(i, 1);

                /* If the last turnpoint has been deleted, then hide the
                 * task table elements.
                 */
                if (m_turnpoints.length == 0) {
                    document.getElementById('turnpoints_heading_div').classList.add('invisible');
                    document.getElementById('task_summary_div').classList.add('invisible');
                }

                document.getElementById('turnpoints_div').removeChild(tp_row);

                rows_dec_array_indexes_after_del(i);

                redraw_task();
                regen_url_hash();
            };

        var none_was_selected = tp_name_select.selectedIndex == -1;

        document.getElementById('turnpoints_div').appendChild(row);

        /* Workaround an issue in Chrome: selectedIndex gets reset from -1
         * to 0 by the appendChild() call. tp_name_select is a child of
         * row.
         */
        if (none_was_selected) {
            tp_name_select.selectedIndex = -1;
        }

        regen_url_hash();
    }
    /* @} */

    /* Add a newly added waypoint's title to the name <select>s. @{
     * The row template <select> is also extended.
     */
    function refresh_after_waypoint_add(
        /* in: newly added waypoint object */
        added_waypoint)
    {
        function append_option_to_select(
            cur_select)
        {
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

        var task_table = document.getElementById('turnpoints_div');

        /* All HTML <select> elements for waypoint names. */
        var name_selects = task_table.getElementsByClassName('turnpoint_name');

        for (var i = 0; i < name_selects.length; i++) {
            append_option_to_select(name_selects[i]);
        }

        var template_div = document.getElementById('turnpoint_row_template_div');
        append_option_to_select(template_div.getElementsByClassName('turnpoint_name')[0]);
    }
    /* @} */

    /* Delete a waypoint from the name <select>s. @{
     * The waypoint's name is deleted also from the template row.
     * Also select-none if the deleted waypoint has been selected in some
     * of the <select>s.
     */
    function refresh_after_waypoint_del(
        /* in: deleted waypoint id */
        waypoint_id)
    {
        function del_waypoint_name_from_select(
            cur_select)
        {
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

                        /* <div><div><select>
                         * the parent of the parent of the <select> is the row
                         */
                        var turnpoint = get_turnpoint_from_row(cur_select.parentNode.parentNode);
                        turnpoint.remove_from_map();
                    }

                    /* Only one <option> could be with the given waypoint_id
                     * in one <select>, so don't bother with the rest of the
                     * <options> in this <select> and continue with the next.
                     */
                    break;
                }
            }
        }

        var task_table = document.getElementById('turnpoints_div');
        /* All HTML <select> elements for waypoint names. */
        var name_selects = task_table.getElementsByClassName('turnpoint_name');

        /* For all <select>s for waypoint names. */
        for (var i = 0; i < name_selects.length; i++) {
            del_waypoint_name_from_select(name_selects[i]);
        }

        var template_div = document.getElementById('turnpoint_row_template_div');
        del_waypoint_name_from_select(template_div.getElementsByClassName('turnpoint_name')[0]);

        redraw_task();
    }
    /* @} */

    /* Rename a waypoint in the name <select>s. @{
     * The waypoint in the template row is also renamed.
     */
    function refresh_after_waypoint_rename(
        /* in: renamed waypoint id */
        waypoint_id)
    {
        function rename_waypoint_in_select(
            cur_select)
        {
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

        var task_table = document.getElementById('turnpoints_div');
        /* All HTML <select> elements for waypoint names. */
        var name_selects = task_table.getElementsByClassName('turnpoint_name');

        /* For all <select>s for waypoint names. */
        for (var i = 0; i < name_selects.length; i++) {
            rename_waypoint_in_select(name_selects[i]);
        }

        var template_div = document.getElementById('turnpoint_row_template_div');
        rename_waypoint_in_select(template_div.getElementsByClassName('turnpoint_name')[0]);
    }
    /* @} */

    /* Export the whole task as an array. @{
     * @return an array that can be passed to import_from_array()
     */
    function export_as_array()
    {
        var arr = new Array();

        var rows = get_rows();
        for (var i = 0; i < rows.length; i++) {

            var turnpoint = get_turnpoint_from_row(rows[i]);

            arr.push(turnpoint.export_as_array());
        }

        return(arr);
    }
    /* @} */

    /* Import the task's data from an array, returned by export_as_array() @{ */
    function import_from_array(
        /* in: array with data */
        arr)
    {
        for (var i = 0; i < arr.length; i++) {
            add_turnpoint(arr[i]);
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

        var rows = get_rows();
        for (var i = 0; i < rows.length; i++) {

            var turnpoint = get_turnpoint_from_row(rows[i]);
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
            case rows.length - 1:
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

        var bounds = m_map_path.bounds();
        for (var i = 0; i < m_turnpoints.length; i++) {
            bounds.expand(m_turnpoints[i].bounds());
        }

        map.fit_bounds(bounds);
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
