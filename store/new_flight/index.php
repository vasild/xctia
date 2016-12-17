<?php

function check_referer() {
    if (!preg_match('/http(s)?:\/\/(xctia.org|www.xctia.org|pg.v5d.org)\//',
        $_SERVER['HTTP_REFERER'])) {
        exit('Error: not allowed referer');
    }
}

function get_id() {
    if (!isset($_POST['id'])) {
        exit('Error: no id supplied');
    }

    $id = $_POST['id'];

    if (!preg_match('/[A-Za-z0-9]{1,32}/', $id)) {
        exit('Error: Invalid id supplied');
    }

    return $id;
}

function get_blob() {
    if (!isset($_POST['blob'])) {
        exit('Error: no blob supplied');
    }

    $blob = $_POST['blob'];

    if (strlen($blob) > 16 * 1024 * 1024 * 1024) {
        exit('Error: the blob is too long');
    }

    return $blob;
}

function save_blob_to_file($file_name, $blob) {

    $file_handle = @fopen($file_name, "xb");

    if (!$file_handle) {
        $errmsg = error_get_last()['message'];
        // There is a race between fopen() failing because the file exists
        // (or for another reason) and file_exists() returning false (or true)
        // because the file was deleted (created) between the fopen() and
        // file_exists() calls. How to check the reason for the fopen()
        // failure?
        if (file_exists($file_name)) {
            // Don't overwrite existing files.
            return;
        } else {
            exit("Error: Cannot open '$file_name' for writing: $errmsg");
        }
    }

    for ($written = 0; $written < strlen($blob); $written += $fwrite) {
        $fwrite = fwrite($file_handle, substr($blob, $written));
        if ($fwrite === false) {
            $errmsg = error_get_last()['message'];
            exit("Error: Cannot write to '$file_name': $errmsg");
        }
    }

    if (!fclose($file_handle)) {
        $errmsg = error_get_last()['message'];
        exit("Error: Cannot close '$file_name': $errmsg");
    }
}

check_referer();

$id = get_id();
$blob = get_blob();

save_blob_to_file("../flights/$id", $blob);

echo 'OK';

?>
