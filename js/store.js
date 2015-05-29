/*
Copyright (c) 2015-2015, Vasil Dimov, http://xctia.org.
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

var parse_has_been_initialized = false;

/* Initialize Parse if it has not been initialized. @{ */
function parse_init_if_not()
{
    if (parse_has_been_initialized) {
        return;
    }

    Parse.initialize(
        /* Application ID */
        'ebICMeML2CFa7Qiez8JZINq3Oe7yn2js1z1z0GGd',
        /* JavaScript Key */
        'jFkXuzsWMcK6MoIEArwtyvlqQ33CDW27aMVNt5IZ');

    parse_has_been_initialized = true;
}
/* @} */

/* Put a flight file (IGC) into the store. @{ */
function store_flight_put(
    /* in: file name */
    file_name,
    /* in: file contents (IGC) */
    igc_raw,
    /* in, out: function to call when completed, on success it will be passed
     * the store id of the flight, if some failure occured, then it will be
     * passed null. */
    callback)
{
    parse_init_if_not();

    /* First store the bare file. */
    var parse_file = new Parse.File(file_name, { base64: base64_encode(igc_raw) });

    parse_file.save().then(
        /* success callback */
        function()
        {
            /* Store of the bare file succeeded. The object 'parse_file' now
             * corresponds on a existing file on the cloud.
             */

            /* Create a new Parse object of type 'Flight'. */
            var parse_flight_t = Parse.Object.extend('Flight');
            var parse_flight = new parse_flight_t();

            /* Store this new object into the cloud with two properties:
             * igc: the file itself (object)
             * igc_file_name: the file name (string).
             */
            parse_flight.save(
                {
                    igc: parse_file,
                    igc_file_name: file_name,
                },
                {
                    success: function(obj)
                    {
                        callback(obj.id);
                    },
                    error: function(obj, error)
                    {
                        alert('Cannot save the flight object into the cloud: [' +
                              + error.code + '] ' + error.message);
                        callback(null);
                    }
                }
            );
        },
        /* error callback */
        function(error)
        {
            alert('Cannot save the flight file into the cloud: [' +
                  + error.code + '] ' + error.message);
            callback(null);
        }
    );
}
/* @} */

/* Retrieve a flight file's content (IGC) and file name from the store. @{
 * @return an object like { file_name: ..., igc_raw: ... }
 */
function store_flight_get(
    /* in: store id of the flight */
    store_id,
    /* in, out: function to call on a success, passing it two arguments:
     * file_name and igc_raw.
     */
    success_cb)
{
    parse_init_if_not();

    /* Create a new Parse object of type 'Flight'. */
    var parse_flight_t = Parse.Object.extend('Flight');

    var query = new Parse.Query(parse_flight_t);

    query.get(
        store_id,
        {
            success: function(res)
            {
                var url = res.get('igc').url();

                var xhr = new XMLHttpRequest();

                xhr.onreadystatechange = function()
                {
                    if (this.readyState == this.DONE) {
                        if (this.status == 200) {
                            success_cb(res.get('igc_file_name'), this.responseText);
                        } else {
                            alert('Cannot fetch flight\'s IGC file from ' +
                                  url + ', got HTTP status code ' + this.status);
                        }
                    }
                }

                xhr.open('GET', url, true /* async */);
                xhr.send();
            },
            error: function(obj, error)
            {
                alert('Cannot retrieve the flight\'s object (id=' + store_id +
                      ') from the cloud: [' + error.code + '] ' + error.message);
            }
        }
    );
}
/* @} */

/* vim: set shiftwidth=4 tabstop=4 expandtab foldmethod=marker foldmarker=@{,@}: */
