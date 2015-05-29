<?php

if (!isset($_FILES['t479xc']) ||
    $_FILES['t479xc']['size'] == 0 ||
    is_array($_FILES['t479xc']['error'])) {

    /* No file has been uploaded or multiple files have been uploaded. */
    http_response_code(400 /* Bad request */);
    return;
}

if ($_FILES['t479xc']['error'] != UPLOAD_ERR_OK) {

    /* PHP encountered some error during upload. */
    http_response_code(400 /* Bad request */);
    echo "PHP upload error: " . $_FILES['t479xc']['error'];
    return;
}

$src = $_FILES['t479xc']['tmp_name'];

$dst = md5_file($src);

if (move_uploaded_file($src, $dst)) {

    $upl_url =
        "http://"
        . $_SERVER["SERVER_NAME"]
        . dirname($_SERVER["SCRIPT_NAME"])
        . "/$dst";

    echo "$upl_url";
} else {
    http_response_code(503 /* Service Unavailable */);
}

/* vim: set shiftwidth=4 tabstop=4 expandtab: */
?>
