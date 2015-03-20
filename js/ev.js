/* Initialize animation. @{
 * Setup events on two elements so that when the first is clicked
 * (arg.clickable_id) the second one (arg.main_id) is hidden
 * according to the animation rules in arg.hide_keyframes.
 * Before show/hide is started arg.before_hide() or arg.before_show() is
 * called and after show/hide has ended arg.after_show() or arg.after_hide()
 * is called.
 */
function ev_init_animation(
    /* in: arguments, must contain the following elements:
     * clickable_id: (string) the id of the HTML element that is clicked to toggle show/hide
     * main_id: (string) the id of the HTML element that is being shown/hidden
     * hide_keyframes: (string) CSS @keyframes animation specification for the hide action
     * before_hide: (function) callback function to execute before hiding starts
     * after_hide: (function) callback function to execute after hiding has ended
     * show_keyframes: (string) CSS @keyframes animation specification for the show action
     * before_show: (function) callback function to execute before showing starts
     * after_show: (function) callback function to execute after showing has ended
     */
    arg)
{
    function onanimationend(
        e)
    {
        if (e.target.id != arg.main_id) {
            return;
        }

        if (e.target.style.animationName == arg.show_keyframes ||
            e.target.style.webkitAnimationName == arg.show_keyframes) {
            /* Cancel the animation so that the object restores its
             * original state when no animations are active. */
            e.target.style.animationName =
            e.target.style.webkitAnimationName = '';

            arg.after_show();
        } else {
            arg.after_hide();
        }
    }

    var main = document.getElementById(arg.main_id);

    main.addEventListener('animationend', onanimationend);
    main.addEventListener('webkitAnimationEnd', onanimationend);

    document.getElementById(arg.clickable_id).onclick =
        function ()
        {
            if (main.style.animationName == arg.show_keyframes ||
                main.style.animationName == '' ||
                main.style.webkitAnimationName == arg.show_keyframes ||
                main.style.webkitAnimationName == '') {

                if (arg.before_hide) {
                    arg.before_hide();
                }

                main.style.animationName =
                main.style.webkitAnimationName = arg.hide_keyframes;
            } else {
                if (arg.before_show) {
                    arg.before_show();
                }

                main.style.animationName =
                main.style.webkitAnimationName = arg.show_keyframes;
            }
        };
}
/* @} */

/* Initialize the events around the waypoints buttons. @{ */
function ev_init_waypoints()
{
    /* When the invisible file input about waypoints get fed up with a file. */
    document.getElementById('load_waypoints_input').onchange =
        function ()
        {
            parse_file(this.files[0], parser_waypoints, null);
        };

    document.getElementById('load_waypoints_button').onclick =
        function ()
        {
            document.getElementById('load_waypoints_input').click();
        };

    document.getElementById('save_waypoints_button').onclick =
        function ()
        {
            waypoints.save();
        };

    document.getElementById('new_waypoint_button').onclick =
        function ()
        {
            var id = waypoints.gen_new_id();
            var map_center = map.center();
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
        };

    ev_init_animation({
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
}
/* @} */

/* Initialize the events around the task buttons. @{ */
function ev_init_task()
{
    document.getElementById('turnpoint_insert_last_td').onclick =
        function ()
        {
            task.add_turnpoint(this.parentNode);
        };

    document.getElementById('task_open_input').onchange =
        function ()
        {
            parse_file(this.files[0], parser_task, null);
        };

    document.getElementById('task_open_button').onclick =
        function ()
        {
            document.getElementById('task_open_input').click();
        };

    document.getElementById('task_save_button').onclick =
        function ()
        {
            task.save();
        };

    ev_init_animation({
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
}
/* @} */

/* Initialize the events around the share action. @{ */
function ev_init_share()
{
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
        };

    document.getElementById('share_table').onclick =
        function ()
        {
            document.getElementById('share_table').style.display = 'none';
        };

    document.getElementById('share_url_short_input').onclick =
    document.getElementById('share_url_long_input').onclick =
        function (e)
        {
            /* Avoid the containing table's onclick event being fired because
             * it hides the whole table.
             */
            e.stopPropagation();
        };
}
/* @} */

/* Initialize the events around the 'similar sites' box. @{ */
function ev_init_similar_sites()
{
    /* Close at page load. */
    document.getElementById('similar_div').style.animationName =
    document.getElementById('similar_div').style.webkitAnimationName = 'similar_foldup';

    ev_init_animation({
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
}
/* @} */

/* Initialize the events around the 'menu toggle' element. @{ */
function ev_init_menu_toggle()
{
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

        var center = map.center();

        for (var i = 1; i < steps; i++) {
            window.setTimeout(
                function ()
                {
                    map.set_center(center);
                    main_map.invalidateSize(true /* animate */);
                },
                dur * 1000 / steps * i
            );
        }
    }

    ev_init_animation({
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
}
/* @} */

/* Setup some cats showing up on the screen at random intervals. @{ */
function ev_init_cats()
{
    function play_running_cat()
    {
        function oncatanimationend(
            e)
        {
            this.style.animationName =
            this.style.webkitAnimationName = '';
        };

        var cat = document.getElementById('cat_run_img');

        cat.addEventListener('animationend', oncatanimationend);
        cat.addEventListener('webkitAnimationEnd', oncatanimationend);

        cat.style.animationName =
        cat.style.webkitAnimationName = 'cat_run';
    };

    function play_peeking_cat()
    {
        var cat = document.getElementById('cat_peek_img');

        /* Reset the .gif so its animation begins now. */
        cat.src = cat.src;

        /* Show the cat. */
        cat.style.display = 'block';

        /* Hide the cat when the animation ends. */
        window.setTimeout(
            function ()
            {
                cat.style.display = 'none';
            },
            1400
        );
    };

    function play_random_cat()
    {
        /* Get a random integer in [0, 1]. */
        switch (Math.floor(Math.random() * 2)) {
        case 0:
            play_running_cat();
            break;
        case 1:
            play_peeking_cat();
            break;
        }
    };

    function play_and_postpone_another(
        first_call)
    {
        if (!first_call) {
            play_random_cat();
        }

        /* Pick up a random point in time in the next few minutes. */
        var min = 3 * 60 * 1000;
        var max = 4 * 60 * 1000;
        window.setTimeout(
            play_and_postpone_another,
            Math.floor(Math.random() * (max - min)) + min
        );
    };

    play_and_postpone_another(true /* first call */);
}
/* @} */

/* Initialize the events. @{ */
function ev_init()
{
    ev_init_waypoints();

    ev_init_task();

    ev_init_share();

    ev_init_similar_sites();

    ev_init_menu_toggle();

    ev_init_cats();
}
/* @} */

/* vim: set shiftwidth=4 tabstop=4 expandtab foldmethod=marker foldmarker=@{,@}: */
