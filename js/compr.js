/* Compress a string and encode the result as a valid URI component. @{
 * @return compressed str, URI-encoded
 */
function compr_compress_to_uri(
    /* in: string to compress */
    str)
{
    var str_lz_uri = LZString.compressToEncodedURIComponent(str);

    if (str != compr_decompress_from_uri(str_lz_uri)) {
        alert('decompress(compress(str)) != str');
        return('');
    }

    return(str_lz_uri);
}
/* @} */

/* Decompress an URI-encoded and compressed string. @{
 * @return the string that was passed to compr_compress_to_uri()
 */
function compr_decompress_from_uri(
    /* in: compressed and URI-encoded string, returned by compr_compress_to_uri() */
    uri)
{
    return(LZString.decompressFromEncodedURIComponent(uri));
}
/* @} */

/* vim: set shiftwidth=4 tabstop=4 expandtab foldmethod=marker foldmarker=@{,@}: */
