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

/* Fetch the altitude of the terrain on a given location(s). @{ */
function altitude_fetch(
    /* in: array of locations (map_latlng_t) */
    locations,
    /* in,out: callback function which is called when the results have been
     * retrieved. It takes 1 argument which is an array of elevations with
     * the same number of elements as the array locations[]. Upon failure
     * a null argument will be passed.
     */
    cb)
{
    var elevator = new google.maps.ElevationService();

    var path = new Array();

    for (var i = 0; i < locations.length; i++) {
        var loc = locations[i];
        path.push(new google.maps.LatLng(loc.lat(), loc.lng()));
    }

    /* A callback function that we pass to the Google API. */
    function g_cb(g_result, stat)
    {
        if (stat == google.maps.ElevationStatus.OK) {
            var result = new Array();

            for (var i = 0; i < g_result.length; i++) {
                result.push(g_result[i].elevation.toFixed(0));
            }

            cb(result);
        } else {
            cb(null);
        }
    }

    if (locations.length == 1) {
        var req = {
            'locations': path,
        };

        elevator.getElevationForLocations(req, g_cb);
    } else {
        var req = {
            'path': path,
            'samples': path.length,
        };

        elevator.getElevationAlongPath(req, g_cb);
    }
}
/* @} */

/* vim: set shiftwidth=4 tabstop=4 expandtab foldmethod=marker foldmarker=@{,@}: */
