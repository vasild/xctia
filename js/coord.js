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

/* Convert degrees:minutes:secondsN ([d]dd:mm:ssN) to fractional degrees. @{
 * For example:
 * '42:28:56N' -> 42.48222
 * '42:28:56S' -> -42.48222
 * '22:28:56E' -> 22.48222
 * @return a fractional number
 */
function coord_convert_ddmmssN2ddd(
    /* in: string in the form of '42:56:29N' */
    ddmmssN)
{
    var ddmmss = ddmmssN.substr(0, ddmmssN.length - 1);
    var direction = ddmmssN.substr(-1);
    var f = ddmmss.split(/:/);

    if (!f) {
        return(0);
    }

    var sign;

    if (direction == 'N' || direction == 'n' ||
        direction == 'E' || direction == 'e') {
        sign = 1;
    } else {
        sign = -1;
    }

    return(sign * (Number(f[0]) + Number(f[1]) / 60 + Number(f[2]) / 3600));
}
/* @} */

/* Convert decimal degrees to degrees:minutes:secondsN (dd:mm:ssN). @{
 * For example:
 * 42.48222, is_lat=true -> '42:28:56N'
 * -42.48222, is_lat=true -> '42:28:56S'
 * 22.48222, is_lat=false -> '22:28:56E'
 * @return string in the form '42:28:56N'
 */
function coord_convert_ddd2ddmmssN(
    /* in: a fractional number */
    ddd,

    /* in: true if the number represents a latitude */
    is_lat)
{
    var direction;

    if (ddd < 0) {
        direction = is_lat ? 'S' : 'W';
        ddd *= -1;
    } else {
        direction = is_lat ? 'N' : 'E';
    }

    var d = Math.floor(ddd);
    var m = Math.floor((ddd - d) * 60);
    var s = Math.round(ddd * 3600 - d * 3600 - m * 60);

    return(zero_pad(d, is_lat ? 2 : 3) + ':' +
           zero_pad(m, 2) + ':' +
           zero_pad(s, 2) +
           direction);
}
/* @} */

/* Calculate the position of the middle of a line. @{
 * @return an array [mid_lat, mid_lng]
 */
function coord_find_middle(
    /* in: first point's latitude */
    x_lat,
    /* in: first point's longtitude */
    x_lng,
    /* in: second point's latitude */
    y_lat,
    /* in: second point's longtitude */
    y_lng)
{
    return(
        [(x_lat + y_lat) / 2, (x_lng + y_lng) / 2]
    );
}
/* @} */

/* vim: set shiftwidth=4 tabstop=4 expandtab foldmethod=marker foldmarker=@{,@}: */
