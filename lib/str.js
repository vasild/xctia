/* String manipulation functions @{
 */

function pad(n, len, padsym) {
    var n_str = n.toString();

    while (n_str.length < len) {
        n_str = padsym + n_str;
    }

    return(n_str);
}

function zero_pad(n, len) {
    return(pad(n, len, '0'));
}

function space_pad(n, len) {
    return(pad(n, len, '\u00A0'));
}

function n_add_sign(n) {
    if (n >= 0) {
        return('+' + n);
    } else {
        return(n.toString());
    }
}

function format_date_into_hhmmsstz(d) {
    return(
        zero_pad(d.getHours(), 2) + ':' +
        zero_pad(d.getMinutes(), 2) + ':' +
        zero_pad(d.getSeconds(), 2) + ' GMT' +
        n_add_sign(-d.getTimezoneOffset() / 60)
    );
}

function format_date_into_yyyymmddhhmmsstz(d) {
    return(
        d.getFullYear() + '.' +
        zero_pad(d.getMonth() + 1, 2) + '.' +
        zero_pad(d.getDate(), 2) + ' ' +
        format_date_into_hhmmsstz(d)
    );
}

function format_date_into_yyyymmdd(d) {
    return(
        d.getFullYear() + '.' +
        zero_pad(d.getMonth() + 1, 2) + '.' +
        zero_pad(d.getDate(), 2)
    );
}

function format_sec_into_hhmmss(sec) {
    var h = zero_pad(Math.floor(sec / 3600), 2);
    var m = zero_pad(Math.floor((sec - h * 3600) / 60), 2);
    var s = zero_pad(sec % 60, 2);

    return(h + ':' + m + ':' + s);
}

function base64_encode(input) {
    if (window.btoa) {
        return(btoa(input));
    } else {
        alert("Does not work in IE");
        return("");
    }
}

function xml_to_str(xml) {
    if (window.ActiveXObject) {
        return(xml.xml);
    } else {
        var serializer = new XMLSerializer();
        return(serializer.serializeToString(xml));
    }
}

function parse_str_into_xml(str) {
    var xml;

    if (window.DOMParser) {
        var parser = new DOMParser();
        xml = parser.parseFromString(str, "text/xml");
    } else { // Internet Explorer
        xml = new ActiveXObject("Microsoft.XMLDOM");
        xml.async = false;
        xml.loadXML(str);
    }

    return(xml);
}

/* @} */
