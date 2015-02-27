/* Export the current state of the map as an array. @{
 * @return [lat, lng, zoom, current_base_layer_name]
 */
function map_save_state()
{
    return(
        [
            parseFloat(main_map.getCenter().lat.toFixed(5)),
            parseFloat(main_map.getCenter().lng.toFixed(5)),
            main_map.getZoom(),
            main_map_current_base_layer_name,
        ]
    );
}
/* @} */

/* Generate a descriptive object from an array returned by map_export_state(). @{
 * Or generate a default state, if the argument is null (no parameters came
 * from the URL) or undefined (an old URL was given that does not contain those
 * parameters).
 * @return an object with properties: center_lat, center_lng, zoom, base_layer_name
 */
function map_restore_state(
    /* in: array returned by map_export_state() */
    arr)
{
    var state;

    if (arr) {
        state =
        {
            center_lat: arr[0],
            center_lng: arr[1],
            zoom: arr[2],
            base_layer_name: arr[3],
        };
    } else {
        state =
        {
            /* Center the map in the middle of Bulgaria. */
            center_lat: 42.751046,
            center_lng: 25.268555,
            zoom: 8,
            base_layer_name: null,
        };
    }

    return(state);
}
/* @} */

/* vim: set shiftwidth=4 tabstop=4 expandtab foldmethod=marker foldmarker=@{,@}: */
