/* Initialize the events:
 * - clicking on the buttons
 */
function ev_init()
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
            waypoints.save();
        }

    document.getElementById('new_waypoint_button').onclick =
        function ()
        {
            var id = waypoints.gen_new_id();
            var map_center = main_map.getCenter();
            waypoints.add(
                waypoint_t(
                    waypoint_data_t(
                        {
                            id: id,
                            lat: map_center.lat,
                            lng: map_center.lng,
                            altitude: 0,
                            /* use the first waypoint type by default */
                            type: Object.keys(waypoint_types)[0],
                            comment: '',
                        }
                    )
                ),
                true
            );
        }

    init_animation({
        clickable_id: 'waypoints_label_div',
        main_id: 'waypoints_div',
        hide_keyframes: 'waypoints_foldup',
        before_hide: function ()
            {
                var rule = html_find_css_rule('waypoints_foldup', CSSRule.KEYFRAMES_RULE, '0%');

                rule.style.height = document.getElementById('waypoints_div').scrollHeight + 'px';
            },
        after_hide: function ()
            {
                document.getElementById('waypoints_label_hide_span').style.display = 'none';
                document.getElementById('waypoints_label_show_span').style.display = 'inline';
            },
        show_keyframes: 'waypoints_folddown',
        before_show: function ()
            {
                var rule = html_find_css_rule('waypoints_folddown', CSSRule.KEYFRAMES_RULE, '100%');

                rule.style.height = document.getElementById('waypoints_div').scrollHeight + 'px';
            },
        after_show: function ()
            {
                document.getElementById('waypoints_label_show_span').style.display = 'none';
                document.getElementById('waypoints_label_hide_span').style.display = 'inline';
            }
    });

    init_animation({
        clickable_id: 'task_label_div',
        main_id: 'task_div',
        hide_keyframes: 'task_foldup',
        before_hide: function ()
            {
                var rule = html_find_css_rule('task_foldup', CSSRule.KEYFRAMES_RULE, '0%');

                rule.style.height = document.getElementById('task_div').scrollHeight + 'px';
            },
        after_hide: function ()
            {
                document.getElementById('task_label_hide_span').style.display = 'none';
                document.getElementById('task_label_show_span').style.display = 'inline';
            },
        show_keyframes: 'task_folddown',
        before_show: function ()
            {
                var rule = html_find_css_rule('task_folddown', CSSRule.KEYFRAMES_RULE, '100%');

                rule.style.height = document.getElementById('task_div').scrollHeight + 'px';
            },
        after_show: function ()
            {
                document.getElementById('task_label_show_span').style.display = 'none';
                document.getElementById('task_label_hide_span').style.display = 'inline';
            }
    });

    /* Pospone a bunch of actions that redraw the map (to fix its state
     * after the container element has been resized) and keep its center
     * to what it was when this function was called.
     */
    function map_smooth_resize()
    {
        var menu_wrap_div = document.getElementById('menu_wrap_div');
        var computed_style = document.defaultView.getComputedStyle(menu_wrap_div);
        var dur = parseFloat(computed_style['animation-duration'] || computed_style['-webkit-animation-duration']);

        var steps = 16;

        var center = main_map.getCenter();

        for (var i = 1; i < steps; i++) {
            window.setTimeout(
                function ()
                {
                    main_map.setView(center);
                    main_map.invalidateSize(true /* animate */);
                },
                dur * 1000 / steps * i
            );
        }
    }

    init_animation({
        clickable_id: 'menu_toggle_span',
        main_id: 'menu_wrap_div',
        hide_keyframes: 'menu_hide',
        before_hide: map_smooth_resize,
        after_hide: function ()
            {
                document.getElementById('menu_toggle_hide_span').style.display = 'none';
                document.getElementById('menu_toggle_show_span').style.display = 'inline';
                main_map.invalidateSize(true /* animate */);
            },
        show_keyframes: 'menu_show',
        before_show: map_smooth_resize,
        after_show: function ()
            {
                document.getElementById('menu_toggle_show_span').style.display = 'none';
                document.getElementById('menu_toggle_hide_span').style.display = 'inline';
                main_map.invalidateSize(true /* animate */);
            }
    });

    document.getElementById('similar_div').style.animationName =
    document.getElementById('similar_div').style.webkitAnimationName = 'similar_foldup';
    init_animation({
        clickable_id: 'similar_label_div',
        main_id: 'similar_div',
        hide_keyframes: 'similar_foldup',
        before_hide: function ()
            {
                var rule = html_find_css_rule('similar_foldup', CSSRule.KEYFRAMES_RULE, '0%');

                rule.style.height = document.getElementById('similar_div').scrollHeight + 'px';
            },
        after_hide: function ()
            {
                document.getElementById('similar_label_hide_span').style.display = 'none';
                document.getElementById('similar_label_show_span').style.display = 'inline';
            },
        show_keyframes: 'similar_folddown',
        before_show: function ()
            {
                var rule = html_find_css_rule('similar_folddown', CSSRule.KEYFRAMES_RULE, '100%');

                rule.style.height = document.getElementById('similar_div').scrollHeight + 'px';
            },
        after_show: function ()
            {
                document.getElementById('similar_label_show_span').style.display = 'none';
                document.getElementById('similar_label_hide_span').style.display = 'inline';
            }
    });

    function oncatanimationend(
        e)
    {
        this.style.animationName = this.style.webkitAnimationName = '';
    }

    var cat = document.getElementById('cat_run_img');

    cat.addEventListener('animationend', oncatanimationend);
    cat.addEventListener('webkitAnimationEnd', oncatanimationend);

    function cat_run(
        first_call)
    {
        if (!first_call) {
            cat.style.animationName = cat.style.webkitAnimationName = 'cat_run';
        }

        /* Pick up a random point in time between the next 2 and 3 minutes */
        var min = 3*60*1000;
        var max = 4*60*1000;
        window.setTimeout(
            cat_run,
            Math.floor(Math.random() * (max - min)) + min
        );
    };

    cat_run(true /* first call */);

    function cat_peek(
        first_call)
    {
        if (!first_call) {
            var cat = document.getElementById('cat_peek_img');
            cat.style.display = "block";
            cat.src = cat.src;

            window.setTimeout(
                function ()
                {
                    cat.style.display = "none";
                },
                1400
            );
        }

        /* Pick up a random point in time between the next 2 and 3 minutes */
        var min = 2*60*1000;
        var max = 3*60*1000;
        window.setTimeout(
            cat_peek,
            Math.floor(Math.random() * (max - min)) + min
        );
    };

    cat_peek(true);

    document.getElementById('turnpoint_insert_last_td').onclick =
        function ()
        {
            task.add_turnpoint(this.parentNode);
        }

    document.getElementById('task_open_input').onchange =
        function ()
        {
            parse_file(this.files[0], parser_task, null);
        }

    document.getElementById('task_open_button').onclick =
        function ()
        {
            document.getElementById('task_open_input').click();
        }

    document.getElementById('task_save_button').onclick =
        function ()
        {
            task.save();
        };

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


