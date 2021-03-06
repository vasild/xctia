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
    document.getElementById('open_waypoints_dat_input').onchange =
        function ()
        {
            parse_file(this.files[0], parser_waypoints, null);
        };

    document.getElementById('open_waypoints_dat_a').onclick =
        function ()
        {
            document.getElementById('open_waypoints_dat_input').click();
        };

    document.getElementById('save_waypoints_dat_a').onclick =
        function ()
        {
            waypoints.save();
        };

    document.getElementById('new_waypoint_a').onclick =
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
                            altitude: null,
                            /* use the first waypoint type by default */
                            type: Object.keys(waypoint_types)[0],
                            comment: '',
                        }
                    )
                ),
                true
            );
        };
}
/* @} */

/* Initialize the events around the task buttons. @{ */
function ev_init_task()
{
    document.getElementById('new_turnpoint_a').onclick =
        function ()
        {
            task.add_turnpoint();
        };

    document.getElementById('open_task_tsk_input').onchange =
        function ()
        {
            parse_file(this.files[0], parser_task, null);
        };

    document.getElementById('open_task_tsk_a').onclick =
        function ()
        {
            document.getElementById('open_task_tsk_input').click();
        };

    document.getElementById('save_task_tsk_a').onclick =
        function ()
        {
            task.save();
        };

    $('#turnpoints_div').on(
        'stop.uk.sortable',
        function () {
            task.redraw_task();
            regen_url_hash();
        }
    );
}
/* @} */

/* Initialize the events around the flight buttons. @{ */
function ev_init_flight()
{
    document.getElementById('open_flight_igc_input').onchange =
        function ()
        {
            parse_file(
                this.files[0],
                /* Parser of the contents. */
                function(
                    /* in: raw IGC contents */
                    igc_str,
                    /* in: IGC file name */
                    file_name)
                {
                    parser_igc(
                        igc_str,
                        file_name,
                        /* Callback */
                        function(
                            /* in: parsed igc object */
                            igc_obj)
                        {
                            store_flight_put_or_get_existent_id(
                                file_name,
                                igc_str,
                                /* Callback */
                                function(
                                    /* in: flight id in the store or null if putting
                                     * into the store failed.
                                     */
                                    store_id)
                                {
                                    flights.add_flight(store_id, igc_obj, true);
                                }
                            );
                        }
                    );
                },
                null
            );
        };

    document.getElementById('open_flight_igc_a').onclick =
        function ()
        {
            document.getElementById('open_flight_igc_input').click();
        };
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
                        '&size=500x500' +
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

/* Initialize the events around the 'menu toggle' element. @{ */
function ev_init_menu_toggle()
{
    ev_init_animation({
        clickable_id: 'menu_toggle_span',
        main_id: 'menu_wrap_div',
        hide_keyframes: 'menu_hide',
        before_hide: null,
        after_hide: function ()
            {
                document.getElementById('menu_toggle_hide_span').style.display = 'none';
                document.getElementById('menu_toggle_show_span').style.display = 'inline';
                map.redraw();
            },
        show_keyframes: 'menu_show',
        before_show: null,
        after_show: function ()
            {
                document.getElementById('menu_toggle_show_span').style.display = 'none';
                document.getElementById('menu_toggle_hide_span').style.display = 'inline';
                map.redraw();
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
        var cat_wrap = document.getElementById('cat_peek_wrap_div');
        var cat = document.getElementById('cat_peek_img');

        /* Reset the .gif so its animation begins now. */
        cat.src = cat.src;

        /* Show the cat. */
        cat_wrap.style.display = 'block';

        /* Hide the cat when the animation ends. */
        window.setTimeout(
            function ()
            {
                cat_wrap.style.display = 'none';
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

    ev_init_flight();

    ev_init_share();

    ev_init_menu_toggle();

    ev_init_cats();
}
/* @} */

/* vim: set shiftwidth=4 tabstop=4 expandtab foldmethod=marker foldmarker=@{,@}: */
