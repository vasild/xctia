/*
Copyright (c) 2015-2016, Vasil Dimov, http://xctia.org.
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

/* Get the store URL prefix. @{ */
function store_get_url_prefix()
{
    /* Derive http://foo.com/path from http://foo.com/path/#whatever. */
    var url = window.location.toString().split(/[#?]/)[0];
    if (url.substr(-1) == '/') {
        url = url.substr(0, url.length - 1);
    }
    return url + '/store';
}
/* @} */

/* Put a flight file (IGC) into the store or retrieve an existent one's id. @{ */
function store_flight_put_or_get_existent_id(
    /* in: file name */
    file_name,
    /* in: file contents (IGC) */
    file_contents,
    /* in, out: function to call when completed, on success it will be passed
     * the store id of the inserted flight or of an existent flight, if one
     * exists with the same file name and contents. If some failure occured,
     * then the callback will still be called but will be passed null. */
    callback)
{
    var store_id = md5(file_name + file_contents);

    var url = store_get_url_prefix() + '/new_flight/';

    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function()
    {
        if (this.readyState == this.DONE) {
            var errmsg_prefix =
                'Could not save flight ' + file_name + ' to the store at ' +
                url + '. If you share this page, the flight will not be shown.';
            if (this.status == 200) {
                var res = this.responseText;
                if (res == 'OK' || res == 'DUPLICATE') {
                    callback(store_id);
                } else {
                    alert(errmsg_prefix + ' Unexpected reply: ' + res + '.');
                    callback(null);
                }
            } else {
                alert(errmsg_prefix + ' Got HTTP status code ' + this.status +
                    '.');
                callback(null);
            }
        }
    }

    xhr.open('POST', url, true /* async */);
    //xhr.setRequestHeader("Content-Type", "multipart/form-data");

    var store_blob = {
        file_name: file_name,
        file_contents: file_contents,
        uploaded: (new Date()).toISOString(),
    };

    var form_data = new FormData();
    form_data.set('id', store_id);
    form_data.set('blob', JSON.stringify(store_blob));

    xhr.send(form_data);
}
/* @} */

/* Retrieve a flight file's content (IGC) and file name from the store. @{
 * Calls a callback function if the flight is found.
 */
function store_flight_get(
    /* in: store id of the flight */
    store_id,
    /* in, out: function to call on a success, passing it 3 arguments:
     * store_id, file_name and file_contents.
     */
    success_cb,
    /* in, out: function to call on a failure, passing it the error message as
     * a string.
     */
    failure_cb)
{
    var url = store_get_url_prefix() + '/flights/' + store_id;

    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function()
    {
        if (this.readyState == this.DONE) {
            if (this.status == 200) {
                try {
                    var res = JSON.parse(this.responseText);
                    if (!res.file_name || !res.file_contents) {
                        throw 'Some of file_name or file_contents are ' +
                            'not set in the response.';
                    }
                    success_cb(store_id, res.file_name, res.file_contents);
                } catch (e) {
                    var msg =
                        'Cannot fetch flight\'s IGC file. Error parsing ' +
                        'the reply from ' + url + ' (see the console for ' +
                        'more details). ';
                    console.log(msg);
                    console.log('HTTP response body: ' + this.responseText);
                    console.log(e);
                    failure_cb(msg);
                }
            } else {
                failure_cb('Cannot fetch flight\'s IGC file from ' +
                    url + ', got HTTP status code ' + this.status);
            }
        }
    }

    xhr.open('GET', url, true /* async */);
    // Silence a "not well-formed" warning in Firefox console if
    // the server does not send any Content-Type in the response.
    xhr.overrideMimeType("application/json");
    xhr.send();
}
/* @} */

/* vim: set shiftwidth=4 tabstop=4 expandtab foldmethod=marker foldmarker=@{,@}: */
