var l1;
var l2;

function init()
{
    l1 = new ol.layer.Tile({
        source: new ol.source.MapQuest({
            layer: 'sat'
        })
    });
    l2 = new ol.layer.Tile({
        source: new ol.source.XYZ({
            url: 'http://maps-for-free.com/layer/relief/z{z}/row{y}/{z}_{x}-{y}.jpg'
        })
    });

    var map = new ol.Map({
        controls: [
            new ol.control.ScaleLine(),
            new ol.control.Zoom()
        ],
        layers: [
            l1,
            l2
        ],
        target: 'map_div',
        view: new ol.View({
            center: ol.proj.transform([25.268555, 42.751046], 'EPSG:4326', 'EPSG:3857'),
            zoom: 8
        })
    });

    l2.setVisible(false);
}

window.onload = init;
//document.ready

/* vim: set shiftwidth=4 tabstop=4 expandtab: */
