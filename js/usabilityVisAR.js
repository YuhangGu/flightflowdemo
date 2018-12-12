AFRAME.registerComponent('flows', {

    schema:{
        linewidth : {type: "float", default: 0.5}
    },

    init: function () {

        //var el = this.el;


        var group = new THREE.Object3D();//create an empty container
        var sceneEl = document.querySelector('a-scene');

        createFlows(addtoSence);


        function createFlows(callback) {

            mapboxgl.accessToken = 'pk.eyJ1IjoiZW5qYWxvdCIsImEiOiJjaWhtdmxhNTIwb25zdHBsejk0NGdhODJhIn0.2-F2hS_oTZenAWc0BMf_uw'

            var map = new mapboxgl.Map({
                container: 'flowmapAR', // container id
                style: 'mapbox://styles/enjalot/cihmvv7kg004v91kn22zjptsc',
                center: [-18.588414, 65.067500],
                zoom: 4.5
            });

            map.on("load", function () {

                var mapbounds = map.getBounds();

                var dev_sw = map.project(mapbounds._sw);
                var dev_ne = map.project(mapbounds._ne);



                var geowidth  = parseInt(Math.abs(dev_ne.x - dev_sw.x) ) ;
                var geoheight = parseInt ( Math.abs( dev_ne.y - dev_sw.y) )  ;


                //console.log("geowidth", geowidth, "geoheight", geoheight);

                var c = document.querySelector("#flowmapVR canvas");
                var texture = THREE.ImageUtils.loadTexture(
                    map.getCanvas().toDataURL() );

                var material = new THREE.MeshBasicMaterial({
                    map: texture
                });

                var geometry = new THREE.PlaneGeometry(8, 6, 2);

                var plane = new THREE.Mesh(geometry, material);


                var newEl = document.createElement('a-entity');
                newEl.setObject3D('plane', plane);
                sceneEl.appendChild(newEl);


                d3.json("../data/icelandlocal.json", function (data) {

                    var width = 8, height = 6;

                    var pGeocenter = [-18.588414, 65.067500];

                    var projection = d3.geoMercator().scale(40)
                        .translate([0, 0])
                        .rotate([0, 0, 0]);


                    var pDevcenter = map.project(pGeocenter);

                    projection.translate([-pDevcenter[0], -pDevcenter[1]])


                    var arcHeight = 2;

                    data.flights.forEach(function (d, i) {


                        var pointO = map.project(d.originloglat);
                        var pointD = map.project(d.destloglat);


                        pointO.x =  (pointO.x - pDevcenter.x) /geowidth * width;
                        pointO.y =  ( pDevcenter.y -pointO.y )/geoheight*height;
                        pointD.x = ( pointD.x - pDevcenter.x) /geowidth * width;
                        pointD.y = (  pDevcenter.y - pointD.y )/geoheight*height;


                        var origin = new THREE.Vector3(pointO.x, pointO.y, 0);
                        var destination = new THREE.Vector3(pointD.x, pointD.y, 0);

                        var ctrl1 = new THREE.Vector3(3 * pointO.x / 4 + pointD.x/ 4, (3 * pointO.y / 4 + pointD.y / 4), arcHeight);
                        var ctrl2 = new THREE.Vector3(pointO.x / 4 + 3 * pointD.x / 4, pointO.y / 4 + 3 * pointD.y / 4, arcHeight);

                        var curve = new THREE.CubicBezierCurve3(origin, ctrl1, ctrl2, destination);

                        var material = new THREE.MeshLambertMaterial({ color: "#9927ba" } );

                        var geometry = new THREE.TubeGeometry( curve, 64, 0.01 /* * i /10 */, 8, false );
                        var mesh = new THREE.Mesh( geometry, material );
                        group.add(mesh);


                    });

                });

            });


            setTimeout(callback, 200);


        }

        function addtoSence() {

            var newEl = document.createElement('a-entity');
            newEl.setObject3D('lineSegments', group);
            sceneEl.appendChild(newEl);
        }

    },

    update: function () {

    }

});
