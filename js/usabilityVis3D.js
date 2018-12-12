/**
 * Created by Aero on 14/11/2017.
 */
L.mapbox.accessToken = 'pk.eyJ1IjoiaXRjYWVybyIsImEiOiJjaWxuZmtlOHQwMDA2dnNseWMybHhvMXh0In0.DObc4iUf1_86LxJGF0RHog';

var Vis = {
    //doc div parameters
    canvasWidth:0,
    canvasHeight: 0,

    // 3D scene component
    camera: null,
    glScene: null,
    glRenderer: null,
    controls: null,

    //2D graphic
    mapWidth: 2800,
    mapHeight: 2400,
    mapZ: 800,
    //mapZ: 300,

    // base map
    theMap : null,
    map_center : {lat: 65.067500 , lng: -18.588414},
    map_scale : 7.2,
    plane_center: null,
    plane_origin: null,

    //flows
    verticts2D: [],

    datasetArr : [],
    //datascaleArr : [],

    datascaleArr : null,

    // [ 3D, color, width]
    visualVarablesArr: [1, 3, 4],

    mapstyles : ["mapbox.streets",
        "mapbox.light",
        "mapbox.dark",
        "mapbox.satellite",
        "mapbox.streets-satellite",
        "mapbox.wheatpaste",
        "mapbox.streets-basic",
        "mapbox.comic",
        "mapbox.outdoors",
        "mapbox.run-bike-hike",
        "mapbox.pencil",
        "mapbox.pirates",
        "mapbox.emerald",
        "mapbox.high-contrast"
    ],

    maxListtime : [],
    minListtime :  [],
    maxListheight :  [],
    minListheight :  [],
    maxListA1 :  [],
    minListA1 :  [],
    maxListA2 :  [],
    minListA2 :  [],


    //object test
    testmesh :null,

    dataAirportNames : null,
    dataAirports: null,
    dataLocalFlights: null,
    airPortCodeList : [
        "AEY",
        "BIU",
        "EGS",
        "GJR",
        "GRY",
        "HFN",
        "HZK",
        "IFJ",
        "KEF",
        "RKV",
        "SAK",
        "THO",
        "VEY",
        "VPN"
    ],

    cube: null
}

function VisInit3D() {

    init3DScene(function () {

        dataProcessing( function () {

            initGeo ( );
            initVisualization();

        });
    });
}



function initVisualization() {


    var companys =["airiceland", "eagleair",  "norlandair"];
    var colorOrdinal = d3.scaleOrdinal(["#3fd464",
        "#ffd60d",
        "#0983ba" ]).domain(companys);

    var height = 24*60;

    createAixs(height);

    //createLabels();

    //redrawOD('point');

    redrawFlows('link');

    update();

    function createAixs(height) {
        var material = new THREE.LineBasicMaterial({ color: "#165686" });
        var geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3( -Vis.mapWidth/2,  Vis.mapHeight/2, height),
            new THREE.Vector3( -Vis.mapWidth/2,  Vis.mapHeight/2, 0),
            new THREE.Vector3(  Vis.mapWidth/2,  Vis.mapHeight/2, 0),
            new THREE.Vector3(  Vis.mapWidth/2,  Vis.mapHeight/2, height),
            new THREE.Vector3( -Vis.mapWidth/2,  Vis.mapHeight/2, height),
            new THREE.Vector3( -Vis.mapWidth/2, -Vis.mapHeight/2, height),
            new THREE.Vector3( -Vis.mapWidth/2, -Vis.mapHeight/2, 0)
        );

        var line = new THREE.Line( geometry, material );
        Vis.glScene.add( line );
    }
    
    function createLabels() {

        Vis.dataAirports.forEach(function (d,i) {

            var point = projectionWorldtoVis(  [ parseFloat( d[0] )  ,  parseFloat( d[1]) ]);
            var str = Vis.airPortCodeList[i]
            var textmesh = createLabel(str, point[0] , point[1], 2, 40, "black", "yellow");
            Vis.glScene.add(textmesh);

        });

        function createLabel(text, x, y, z, size, color, backGroundColor, backgroundMargin) {

            if(!backgroundMargin)
                backgroundMargin = 50;
            var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");
            context.font = size + "pt Arial";
            var textWidth = context.measureText(text).width;
            canvas.width = textWidth + backgroundMargin;
            canvas.height = size + backgroundMargin;
            context = canvas.getContext("2d");
            context.font = size + "pt Arial";
            if(backGroundColor) {
                context.fillStyle = backGroundColor;
                context.fillRect(canvas.width / 2 - textWidth / 2 - backgroundMargin / 2,
                    canvas.height / 2 - size / 2 - +backgroundMargin / 2,
                    textWidth + backgroundMargin, size + backgroundMargin);
            }
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillStyle = color;
            context.fillText(text, canvas.width / 2, canvas.height / 2);
            // context.strokeStyle = "black";
            // context.strokeRect(0, 0, canvas.width, canvas.height);
            var texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            var material = new THREE.MeshBasicMaterial({
                map : texture
            });
            var mesh = new THREE.Mesh(new THREE.PlaneGeometry(canvas.width, canvas.height), material);
            // mesh.overdraw = true;
            mesh.doubleSided = true;
            //mesh.position.x = x - canvas.width;
            //mesh.position.y = y - canvas.height;

            mesh.position.x = x;
            mesh.position.y = y ;
            mesh.position.z = z;
            return mesh;
        }

    }

}

function dataProcessing(callback) {

    d3.json("../data/icelandlocal.json", function(error, data){


        Vis.dataAirportNames = data.airportsDictionary;
        //Vis.dataAirports = data.airportsGeo;
        Vis.dataLocalFlights = data.flights;

        Vis.dataAirports = data.airportsGeo.map(function (d) {
            return [  parseFloat(d[1])  ,  parseFloat(d[0])  ];
        });

    });

    setTimeout(callback, 200);
}

function init3DScene(callback) {


    Vis.canvasWidth = $("#flowmap3D").width()
    Vis.canvasHeight = $("#flowmap3D").height();


    Vis.camera = new THREE.PerspectiveCamera( 35, Vis.canvasWidth / Vis.canvasHeight, 1, 10000);
    Vis.camera.position.set(0, -4000, 4000)

    //reate two renders
    Vis.glRenderer = createGlRenderer();
    Vis.cssRenderer = createCssRenderer();

    var mapdiv = document.getElementById("flowmap3D");
    mapdiv.appendChild(Vis.cssRenderer.domElement);

    Vis.cssRenderer.domElement.appendChild(Vis.glRenderer.domElement);
    Vis.glRenderer.shadowMap.enabled = true;
    Vis.glRenderer.shadowMap.type = THREE.PCFShadowMap;
    Vis.glRenderer.shadowMapAutoUpdate = true;

    Vis.glScene = new THREE.Scene();
    Vis.cssScene = new THREE.Scene();

    var ambientLight = new THREE.AmbientLight(0x445555);
    Vis.glScene.add(ambientLight);
    var directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(1000, -2, 30).normalize();
    Vis.glScene.add(directionalLight);
    var directionalLight1 = new THREE.DirectionalLight(0xffffff);
    directionalLight1.position.set(-1000, -2, 3000).normalize();
    Vis.glScene.add(directionalLight1);

    Vis.controls = new THREE.TrackballControls(Vis.camera, Vis.cssRenderer.domElement);
    Vis.controls.rotateSpeed = 2;
    Vis.controls.minDistance = 30;
    Vis.controls.maxDistance = 8000;

    function createGlRenderer() {
        var glRenderer = new THREE.WebGLRenderer({alpha: true});
        glRenderer.setClearColor(0x3D3252);
        glRenderer.setPixelRatio(window.devicePixelRatio);
        glRenderer.setSize(Vis.canvasWidth, Vis.canvasHeight);
        glRenderer.domElement.style.position = 'absolute';
        glRenderer.domElement.style.zIndex = 1;
        glRenderer.domElement.style.top = 0;
        return glRenderer;
    }

    function createCssRenderer() {
        var cssRenderer = new THREE.CSS3DRenderer();
        cssRenderer.setSize(Vis.canvasWidth, Vis.canvasHeight);
        cssRenderer.domElement.style.top = 0;
        return cssRenderer;
    }

    setTimeout(callback,200);
}

function initGeo(){

    createMap();
    //creatTheAixs();

    function createMap() {

        var material = new THREE.MeshBasicMaterial({
            color: 0x000000,
            opacity: 0.0,
            side: THREE.DoubleSide
        });

        var geometry = new THREE.PlaneGeometry(Vis.mapWidth, Vis.mapHeight);
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = 0;
        mesh.position.y = 0;
        mesh.position.z = 0;
        mesh.receiveShadow	= true;
        mesh.name = "map";
        Vis.glScene.add(mesh);

        d3.selectAll('.map-div')
            .data([0, 1]).enter()
            .append("div")
            .attr("class", "map-div")
            .attr("id",function (d,i) {
                return "mappad" + i;
            })
            .each(function (d , i) {


                if(i == 0){
                    mapboxgl.accessToken = 'pk.eyJ1IjoiZW5qYWxvdCIsImEiOiJjaWhtdmxhNTIwb25zdHBsejk0NGdhODJhIn0.2-F2hS_oTZenAWc0BMf_uw'

                    Vis.theMap = new mapboxgl.Map({
                        container: 'mappad0', // container id
                        style: 'mapbox://styles/enjalot/cihmvv7kg004v91kn22zjptsc',
                        center: [ Vis.map_center.lng, Vis.map_center.lat],
                        zoom: Vis.map_scale});

                    Vis.theMap.on('load', function () {

                        var mapcontener = document.getElementById("mappad0");
                        var cssObject = new THREE.CSS3DObject(mapcontener);
                        cssObject.position.x = 0;
                        cssObject.position.y = 0;
                        cssObject.position.z = 0;
                        cssObject.receiveShadow	= true;
                        cssObject.name = "map";
                        Vis.cssScene.add(cssObject);
                    });


                }
                else if(i == 1 ){

                    Vis.plane_origin =  Vis.theMap.project( [ Vis.map_center.lng, Vis.map_center.lat] );

                    var svg = d3.select("#mappad1").append("svg")
                        .attr('width',2800)
                        .attr('height', 2400);

                    //----------
                    var d3Projection = getD3();

                    //var path = d3.geoPath();

                    Vis.airportsIn3D = svg.selectAll("circle").data( Vis.dataAirports )
                        .enter().append("circle")
                        .attr('class', 'airportsOn3DMap');

                    Vis.airportNames = svg.selectAll("text").data(  Vis.dataAirports )
                        .enter().append("text")
                        .attr("class", "airportlabelOn3DMap")
                        .text( function (d,i) {
                            return Vis.dataAirportNames[i];
                        });


                    Vis.theMap.on("viewreset", function() {
                        render()
                    })
                    Vis.theMap.on("move", function() {
                        render()
                    })


                    render();

                    function getD3() {


                        var center =  Vis.theMap.getCenter();
                        var zoom =  Vis.theMap.getZoom();
                        // 512 is hardcoded tile size, might need to be 256 or changed to suit your map config
                        var scale = (512) * 0.5 / Math.PI * Math.pow(2, zoom);

                        var d3projection = d3.geoMercator()
                            .center([center.lng, center.lat])
                            .translate([    Vis.mapWidth/2,     Vis.mapHeight/2])
                            .scale(scale);

                        return d3projection;
                    }

                    function render() {

                        d3Projection = getD3();

                        Vis.airportsIn3D
                            .attr('cx', function (d) {
                                return d3Projection(d)[0] ;
                            })
                            .attr('cy',  function (d) {
                                return d3Projection(d)[1];
                            });

                        Vis.airportNames
                            .attr('x',  function (d) {
                                return d3Projection(d)[0] ;
                            })
                            .attr('y',  function (d) {
                                return d3Projection(d)[1]+ 60;
                            });
                    }


                    var mapcontener = document.getElementById("mappad1");
                    var cssObject = new THREE.CSS3DObject(mapcontener);
                    cssObject.position.x = 0;
                    cssObject.position.y = 0;
                    cssObject.position.z = 4;
                    cssObject.receiveShadow	= true;
                    cssObject.name = "map";
                    Vis.cssScene.add(cssObject);
                }

            });

    }

    function creatTheAixs(){

        var material = new THREE.LineBasicMaterial({ color: "#08090b" });
        var geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3( -Vis.mapWidth/2,  Vis.mapHeight/2, Vis.mapZ),
            new THREE.Vector3( -Vis.mapWidth/2,  Vis.mapHeight/2, 0),
            new THREE.Vector3(  Vis.mapWidth/2,  Vis.mapHeight/2, 0),
            new THREE.Vector3(  Vis.mapWidth/2,  Vis.mapHeight/2, Vis.mapZ),
            new THREE.Vector3( -Vis.mapWidth/2,  Vis.mapHeight/2, Vis.mapZ),
            new THREE.Vector3( -Vis.mapWidth/2, -Vis.mapHeight/2, Vis.mapZ),
            new THREE.Vector3( -Vis.mapWidth/2, -Vis.mapHeight/2, 0)
        );

        var line = new THREE.Line( geometry, material );
        Vis.glScene.add( line );
    }


}

function redrawOD(ODType) {

    while(Vis.glScene.getObjectByName("OD")){
        var selectedObject = Vis.glScene.getObjectByName("OD");
        Vis.glScene.remove( selectedObject );
    }


    switch (ODType) {

        case 'point':

            Vis.dataAirports.forEach(function (d) {

                var point = projectionWorldtoVis(  [ parseFloat( d[0] )  ,  parseFloat( d[1]) ]);
                var geometry = new THREE.SphereGeometry( 32, 32, 32 );
                var material = new THREE.MeshLambertMaterial( {color: 0xffff00} );
                var sphere = new THREE.Mesh( geometry, material );


                sphere.position.x = point[0];
                sphere.position.y = point[1];
                sphere.position.z = 0;
                sphere.name = "OD"

                Vis.glScene.add( sphere );

            });

            break;


        case 'height':

            var arr = Vis.dataAirports.map(function (value) { return parseFloat(value[2]) });
            var heightlinear = d3.scaleLinear().domain([0, d3.max(arr)] ).range([0, 24*60 - 50]);

            Vis.dataAirports.forEach(function (d) {

                var point = projectionWorldtoVis(  [ parseFloat( d[0] )  ,  parseFloat( d[1]) ]);
                var geometry = new THREE.SphereGeometry( 32, 32, 32 );
                var material = new THREE.MeshLambertMaterial( {color: 0xffff00} );
                var sphere = new THREE.Mesh( geometry, material );

                sphere.position.x = point[0];
                sphere.position.y = point[1] ;
                sphere.position.z = heightlinear ( parseFloat(d[2]) );

                sphere.name = "OD";

                Vis.glScene.add( sphere );

            });

            break;


        case 'time':

            //console.log("function here time");
            break;


        case 'attrQL':

            //console.log("function here attribute");
            break;
        case 'attrQT':

            //console.log("function here attribute");
            break;
    }

    update();
}

function redrawFlows(flowType){

    while(Vis.glScene.getObjectByName("flows3D")){
        var selectedObject = Vis.glScene.getObjectByName("flows3D");
        Vis.glScene.remove( selectedObject );
    }


    var height = 60 * 24;
    var arcHeight = height / 5;

    // for the size, height: QT
    var tubeRadius = 2;
    var scaleSizeQT = d3.scaleLinear().domain([1, 7] ).range([2, 14]);
    var scaleHeightQT = d3.scaleLinear().domain([1, 7] ).range([0, 24*60 - 50]);
    var scaleColorQT  = d3.scaleLinear().domain([1, 7] ).range(["#0983ba", "#e24d20"]);

    //for the size, color: QL
    var companys =["airiceland", "eagleair",  "norlandair"];
    var heightOrdinal = d3.scaleOrdinal([50, 250, 450 ]).domain(companys);
    var colorOrdinal = d3.scaleOrdinal(["#3fd464", "#ffd60d", "#0983ba" ]).domain(companys);

    //var flowchecksizeAttr = $('#checkbox-flow-size-attrQT')[0].checked;

    var flowchecksizeAttr = 0;

    var flowcolorattr = $('input[name="radioFlowColor"]:checked').val();


    switch (flowType) {

        case 'link':
            Vis.dataLocalFlights.forEach(function (d) {

                var material  = null;
                if(flowcolorattr == 'attrQL'){
                    material = new THREE.MeshLambertMaterial({ color: colorOrdinal(  d.companyname )} );
                }
                else if(flowcolorattr == 'attrQT'){
                    material = new THREE.MeshLambertMaterial({ color: scaleColorQT(  d3.sum(d.dateweek)) } );
                }
                else{
                    material = new THREE.MeshLambertMaterial({ color: "#e24d20" } );
                }

                if(flowchecksizeAttr){
                    var raduis = d3.sum(d.dateweek ) ;
                    tubeRadius = scaleSizeQT(raduis);
                }

                var pointO = projectionWorldtoVis( d.originloglat );
                var pointD = projectionWorldtoVis( d.destloglat );


                var origin = new THREE.Vector3( pointO[0] ,  pointO[1] , 1);
                var destination = new THREE.Vector3( pointD[0] , pointD[1] , 1);

                var ctrl1 = new THREE.Vector3( 3*pointO[0]/4 + pointD[0]/4 ,  (3*pointO[1]/4 + pointD[1]/4),  arcHeight);
                var ctrl2 = new THREE.Vector3( pointO[0]/4 + 3*pointD[0]/4, pointO[1]/4 + 3*pointD[1]/4 ,  arcHeight );

                var curve = new THREE.CubicBezierCurve3(origin,ctrl1,ctrl2,destination);

                var geometry = new THREE.TubeGeometry( curve, 64, tubeRadius, 8, false );
                var mesh = new THREE.Mesh( geometry, material );
                mesh.name = "flows3D";
                Vis.glScene.add(mesh);

            });
            break;


        case 'height':
            Vis.dataLocalFlights.forEach(function (d) {

                var material  = null;
                if(flowcolorattr == 'attrQL'){
                    material = new THREE.MeshLambertMaterial({ color: colorOrdinal(  d.companyname )} );
                }
                else if(flowcolorattr == 'attrQT'){
                    material = new THREE.MeshLambertMaterial({ color: scaleColorQT(  d3.sum(d.dateweek)) } );
                }
                else{
                    material = new THREE.MeshLambertMaterial({ color: "#e24d20" } );
                }

                if(flowchecksizeAttr){
                    var raduis = d3.sum(d.dateweek ) ;
                    tubeRadius = scaleSizeQT(raduis);
                }


                var pointO = projectionWorldtoVis([d.originloglat[1], d.originloglat[0]]);
                var pointD = projectionWorldtoVis([d.destloglat[1], d.destloglat[0]]);

                var origin = new THREE.Vector3( pointO[0] ,  pointO[1] , 1);
                var destination = new THREE.Vector3( pointD[0] , pointD[1] , 1);

                var ctrl1 = new THREE.Vector3( 3*pointO[0]/4 + pointD[0]/4 ,  (3*pointO[1]/4 + pointD[1]/4),  arcHeight);
                var ctrl2 = new THREE.Vector3( pointO[0]/4 + 3*pointD[0]/4, pointO[1]/4 + 3*pointD[1]/4 ,  arcHeight );


                var curve = new THREE.CubicBezierCurve3(origin,ctrl1,ctrl2,destination);

                var geometry = new THREE.TubeGeometry( curve, 64, tubeRadius, 8, false );
                var mesh = new THREE.Mesh( geometry, material );
                mesh.name = "flows3D";
                Vis.glScene.add(mesh);

            });
            break;

        case 'time':
            Vis.dataLocalFlights.forEach(function (d) {

                if(flowchecksizeAttr){
                    var raduis = d3.sum(d.dateweek ) ;
                    tubeRadius = scaleSizeQT(raduis);
                }


                var pointO = projectionWorldtoVis([d.originloglat[1], d.originloglat[0]]);
                var pointD = projectionWorldtoVis([d.destloglat[1], d.destloglat[0]]);

                var timeArr1 = d.departure.split(":");
                var timeO = parseInt(timeArr1[0])*60 + parseInt(timeArr1[1]);

                var timeArr2 = d.arrival.split(":");
                var timeD = parseInt(timeArr2[0])*60 + parseInt(timeArr2[1]);

                var material  = null;
                if(flowcolorattr == 'attrQL'){
                    material = new THREE.MeshLambertMaterial({ color: colorOrdinal(  d.companyname )} );
                }
                else if(flowcolorattr == 'attrQT'){
                    material = new THREE.MeshLambertMaterial({ color: scaleColorQT(  d3.sum(d.dateweek)) } );
                }
                else{
                    material = new THREE.MeshLambertMaterial({ color: "#e24d20" } );
                }

                var origin = new THREE.Vector3( pointO[0] ,  pointO[1] , timeO);
                var destination = new THREE.Vector3( pointD[0] , pointD[1] , timeD);
                var curve = new THREE.LineCurve(origin,destination);

                var geometry = new THREE.TubeGeometry( curve, 64, tubeRadius, 8, false );
                var mesh = new THREE.Mesh( geometry, material );
                mesh.name = "flows3D";
                Vis.glScene.add(mesh);

            });
            break;

        case 'attrQL':
            Vis.dataLocalFlights.forEach(function (d) {

                if(flowchecksizeAttr){
                    var raduis = d3.sum(d.dateweek ) ;
                    tubeRadius = scaleSizeQT(raduis);
                }

                var pointO = projectionWorldtoVis([d.originloglat[1], d.originloglat[0]]);
                var pointD = projectionWorldtoVis([d.destloglat[1], d.destloglat[0]]);


                var material  = null;
                if(flowcolorattr == 'attrQL'){
                    material = new THREE.MeshLambertMaterial({ color: colorOrdinal(  d.companyname )} );
                }
                else if(flowcolorattr == 'attrQT'){
                    material = new THREE.MeshLambertMaterial({ color: scaleColorQT(  d3.sum(d.dateweek)) } );
                }
                else{
                    material = new THREE.MeshLambertMaterial({ color: "#e24d20" } );
                }

                var origin = new THREE.Vector3( pointO[0] ,  pointO[1] , heightOrdinal(d.companyname));
                var destination = new THREE.Vector3( pointD[0] , pointD[1] , heightOrdinal(d.companyname));
                var curve = new THREE.LineCurve(origin,destination);

                var geometry = new THREE.TubeGeometry( curve, 64, tubeRadius, 8, false );
                var mesh = new THREE.Mesh( geometry, material );
                mesh.name = "flows3D";
                Vis.glScene.add(mesh);

            });
            break;

        case 'attrQT':

            Vis.dataLocalFlights.forEach(function (d) {

                arcHeight =  scaleHeightQT( d3.sum(d.dateweek ));

                var material  = null;
                if(flowcolorattr == 'attrQL'){
                    material = new THREE.MeshLambertMaterial({ color: colorOrdinal(  d.companyname )} );
                }
                else if(flowcolorattr == 'attrQT'){
                    material = new THREE.MeshLambertMaterial({ color: scaleColorQT(  d3.sum(d.dateweek)) } );
                }
                else{
                    material = new THREE.MeshLambertMaterial({ color: "#e24d20" } );
                }


                if(flowchecksizeAttr){
                    var raduis = d3.sum(d.dateweek ) ;
                    tubeRadius = scaleSizeQT(raduis);
                }


                var pointO = projectionWorldtoVis([d.originloglat[1], d.originloglat[0]]);
                var pointD = projectionWorldtoVis([d.destloglat[1], d.destloglat[0]]);

                var origin = new THREE.Vector3( pointO[0] ,  pointO[1] , 1);
                var destination = new THREE.Vector3( pointD[0] , pointD[1] , 1);

                var ctrl1 = new THREE.Vector3( 3*pointO[0]/4 + pointD[0]/4 ,  (3*pointO[1]/4 + pointD[1]/4),  arcHeight);
                var ctrl2 = new THREE.Vector3( pointO[0]/4 + 3*pointD[0]/4, pointO[1]/4 + 3*pointD[1]/4 ,  arcHeight );

                var curve = new THREE.CubicBezierCurve3(origin,ctrl1,ctrl2,destination);

                var geometry = new THREE.TubeGeometry( curve, 64, tubeRadius, 8, false );
                var mesh = new THREE.Mesh( geometry, material );
                mesh.name = "flows3D";
                Vis.glScene.add(mesh);

            });
            break;
    }

    update();
}

function rearrangeODMaps(ODType) {

    //console.log(ODType);

    while(Vis.glScene.getObjectByName("OD")){
        var selectedObject = Vis.glScene.getObjectByName("OD");
        Vis.glScene.remove( selectedObject );
    }
    while(Vis.glScene.getObjectByName("flows3D")){
        var selectedObject = Vis.glScene.getObjectByName("flows3D");
        Vis.glScene.remove( selectedObject );
    }

    while(Vis.glScene.getObjectByName("map")){
        var selectedObject = Vis.glScene.getObjectByName("map");
        Vis.glScene.remove( selectedObject );
    }
    while(Vis.cssScene.getObjectByName("map")){
        var selectedObject = Vis.cssScene.getObjectByName("map");
        Vis.cssScene.remove( selectedObject );
    }

    var height = 60 * 24;
    var arcHeight = height / 5;

    // for the size, height: QT
    var tubeRadius = 10;
    var scaleSizeQT = d3.scaleLinear().domain([1, 7] ).range([2, 14]);
    var scaleHeightQT = d3.scaleLinear().domain([1, 7] ).range([0, 24*60 - 50]);
    var scaleColorQT  = d3.scaleLinear().domain([1, 7] ).range(["#0983ba", "#e24d20"]);

    //for the size, color: QL
    var companys =["airiceland", "eagleair",  "norlandair"];
    var heightOrdinal = d3.scaleOrdinal([50, 250, 450 ]).domain(companys);
    var colorOrdinal = d3.scaleOrdinal(["#3fd464", "#ffd60d", "#0983ba" ]).domain(companys);

    var flowchecksizeAttr = $('#checkbox-flow-size-attrQT')[0].checked;

    var flowcolorattr = $('input[name="radioFlowColor"]:checked').val();


    switch (ODType) {

        case 'same':
            Vis.dataLocalFlights.forEach(function (d) {

                var material  = null;
                if(flowcolorattr == 'attrQL'){
                    material = new THREE.MeshLambertMaterial({ color: colorOrdinal(  d.companyname )} );
                }
                else if(flowcolorattr == 'attrQT'){
                    material = new THREE.MeshLambertMaterial({ color: scaleColorQT(  d3.sum(d.dateweek)) } );
                }
                else{
                    material = new THREE.MeshLambertMaterial({ color: "#e24d20" } );
                }

                if(flowchecksizeAttr){
                    var raduis = d3.sum(d.dateweek ) ;
                    tubeRadius = scaleSizeQT(raduis);
                }

                var pointO = projectionWorldtoVis([d.originloglat[1], d.originloglat[0]]);
                var pointD = projectionWorldtoVis([d.destloglat[1], d.destloglat[0]]);

                var origin = new THREE.Vector3( pointO[0] ,  pointO[1] , 1);
                var destination = new THREE.Vector3( pointD[0] , pointD[1] , 1);

                var ctrl1 = new THREE.Vector3( 3*pointO[0]/4 + pointD[0]/4 ,  (3*pointO[1]/4 + pointD[1]/4),  arcHeight);
                var ctrl2 = new THREE.Vector3( pointO[0]/4 + 3*pointD[0]/4, pointO[1]/4 + 3*pointD[1]/4 ,  arcHeight );

                var curve = new THREE.CubicBezierCurve3(origin,ctrl1,ctrl2,destination);

                var geometry = new THREE.TubeGeometry( curve, 64, tubeRadius, 8, false );
                var mesh = new THREE.Mesh( geometry, material );
                mesh.name = "flows3D";
                Vis.glScene.add(mesh);

            });
            break;

        case 'stack':

            createODMapsStack();

            Vis.dataLocalFlights.forEach(function (d) {

                var material  = null;
                if(flowcolorattr == 'attrQL'){
                    material = new THREE.MeshLambertMaterial({ color: colorOrdinal(  d.companyname )} );
                }
                else if(flowcolorattr == 'attrQT'){
                    material = new THREE.MeshLambertMaterial({ color: scaleColorQT(  d3.sum(d.dateweek)) } );
                }
                else{
                    material = new THREE.MeshLambertMaterial({ color: "#e24d20" } );
                }

                if(flowchecksizeAttr){
                    var raduis = d3.sum(d.dateweek ) ;
                    tubeRadius = scaleSizeQT(raduis);
                }


                var pointO = projectionWorldtoVis([d.originloglat[1], d.originloglat[0]]);
                var pointD = projectionWorldtoVis([d.destloglat[1], d.destloglat[0]]);

                var origin = new THREE.Vector3( pointO[0] ,  pointO[1] , 1);
                var destination = new THREE.Vector3( pointD[0] , pointD[1] , 24*60);

                var ctrl1 = new THREE.Vector3( 3*pointO[0]/4 + pointD[0]/4 ,  (3*pointO[1]/4 + pointD[1]/4),  100);
                var ctrl2 = new THREE.Vector3( pointO[0]/4 + 3*pointD[0]/4, pointO[1]/4 + 3*pointD[1]/4 ,  24*60 - 100 );


                var curve = new THREE.CubicBezierCurve3(origin,ctrl1,ctrl2,destination);

                var geometry = new THREE.TubeGeometry( curve, 64, tubeRadius, 8, false );
                var mesh = new THREE.Mesh( geometry, material );
                mesh.name = "flows3D";
                Vis.glScene.add(mesh);

            });


            break;

        case 'parallel':

            createODMapsParallel();

            arcHeight = 1000;
            Vis.dataLocalFlights.forEach(function (d) {

                var material  = null;
                if(flowcolorattr == 'attrQL'){
                    material = new THREE.MeshLambertMaterial({ color: colorOrdinal(  d.companyname )} );
                }
                else if(flowcolorattr == 'attrQT'){
                    material = new THREE.MeshLambertMaterial({ color: scaleColorQT(  d3.sum(d.dateweek)) } );
                }
                else{
                    material = new THREE.MeshLambertMaterial({ color: "#e24d20" } );
                }

                if(flowchecksizeAttr){
                    var raduis = d3.sum(d.dateweek ) ;
                    tubeRadius = scaleSizeQT(raduis);
                }


                var pointO = projectionWorldtoVis([d.originloglat[1], d.originloglat[0]]);
                var pointD = projectionWorldtoVis([d.destloglat[1], d.destloglat[0]]);

                var origin = new THREE.Vector3( pointO[0] ,  pointO[1] , 1);
                var destination = new THREE.Vector3( pointD[0] + Vis.mapWidth, pointD[1] , 1);

                var ctrl1 = new THREE.Vector3( 3*pointO[0]/4 + (pointD[0] + Vis.mapWidth)/4 ,
                    (3*pointO[1]/4 + pointD[1]/4),  arcHeight);
                var ctrl2 = new THREE.Vector3( pointO[0]/4 + 3*(pointD[0] + Vis.mapWidth)/4,
                    pointO[1]/4 + 3*pointD[1]/4 ,  arcHeight );


                var curve = new THREE.CubicBezierCurve3(origin,ctrl1,ctrl2,destination);

                var geometry = new THREE.TubeGeometry( curve, 64, tubeRadius, 8, false );
                var mesh = new THREE.Mesh( geometry, material );
                mesh.name = "flows3D";
                Vis.glScene.add(mesh);

            });


            break;

        case 'embed':

            break;
    }



    function createODMapsStack() {


        var material = new THREE.MeshBasicMaterial({
            color: 0x000000,
            opacity: 0.0,
            side: THREE.DoubleSide
        });

        d3.selectAll('.mapnew-div')
            .data([0, 1]).enter()
            .append("div")
            .attr("class", "mapnew-div")
            .attr("id",function (d) {
                return "mappadnew" + d;
            })
            .each(function (d) {
                var map = L.mapbox.map("mappadnew" + d, Vis.mapstyles[12]).setView([Vis.map_center.lat, Vis.map_center.lng],Vis.map_scale);
                Vis.theMap = map;
                Vis.plane_origin = Vis.theMap.getPixelOrigin();
                Vis.plane_center = Vis.theMap.project(L.latLng(Vis.map_center.lat, Vis.map_center.lng));
            });

        var geometry = new THREE.PlaneGeometry(Vis.mapWidth, Vis.mapHeight);
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = 0;
        mesh.position.y = 0;
        mesh.position.z = 0;
        mesh.receiveShadow	= true;
        mesh.name = "map";
        Vis.glScene.add(mesh);

        var mapcontener = document.getElementById("mappadnew1");
        var cssObject = new THREE.CSS3DObject(mapcontener);
        cssObject.position.x = 0;
        cssObject.position.y = 0;
        cssObject.position.z = 0;
        cssObject.receiveShadow	= true;
        cssObject.name = "map";

        Vis.cssScene.add(cssObject);

        var geometry = new THREE.PlaneGeometry(Vis.mapWidth, Vis.mapHeight);
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = 0;
        mesh.position.y = 0;
        mesh.position.z = 24*60;
        mesh.receiveShadow	= true;
        mesh.name = "map";
        Vis.glScene.add(mesh);


        var mapcontener = document.getElementById("mappadnew0");
        var cssObject = new THREE.CSS3DObject(mapcontener);
        cssObject.position.x = 0;
        cssObject.position.y = 0;
        cssObject.position.z = 24*60;
        cssObject.receiveShadow	= true;
        cssObject.name = "map";

        Vis.cssScene.add(cssObject);
    }

    function createODMapsParallel () {


        var material = new THREE.MeshBasicMaterial({
            color: 0x000000,
            opacity: 0.0,
            side: THREE.DoubleSide
        });

        d3.selectAll('.mapnew-div')
            .data([0, 1]).enter()
            .append("div")
            .attr("class", "mapnew-div")
            .attr("id",function (d) {
                return "mappadnew" + d;
            })
            .each(function (d) {
                var map = L.mapbox.map("mappadnew" + d, Vis.mapstyles[12]).setView([Vis.map_center.lat, Vis.map_center.lng],Vis.map_scale);
                Vis.theMap = map;
                Vis.plane_origin = Vis.theMap.getPixelOrigin();
                Vis.plane_center = Vis.theMap.project(L.latLng(Vis.map_center.lat, Vis.map_center.lng));
            });

        var geometry = new THREE.PlaneGeometry(Vis.mapWidth, Vis.mapHeight);
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = Vis.mapWidth;
        mesh.position.y = 0;
        mesh.position.z = 0;
        mesh.receiveShadow	= true;
        mesh.name = "map";
        Vis.glScene.add(mesh);

        var mapcontener = document.getElementById("mappadnew1");
        var cssObject = new THREE.CSS3DObject(mapcontener);
        cssObject.position.x = Vis.mapWidth;
        cssObject.position.y = 0;
        cssObject.position.z = 0;
        cssObject.receiveShadow	= true;
        cssObject.name = "map";

        Vis.cssScene.add(cssObject);

        var geometry = new THREE.PlaneGeometry(Vis.mapWidth, Vis.mapHeight);
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = 0;
        mesh.position.y = 0;
        mesh.position.z = 0;
        mesh.receiveShadow	= true;
        mesh.name = "map";
        Vis.glScene.add(mesh);


        var mapcontener = document.getElementById("mappadnew0");
        var cssObject = new THREE.CSS3DObject(mapcontener);
        cssObject.position.x = 0;
        cssObject.position.y = 0;
        cssObject.position.z = 0;
        cssObject.receiveShadow	= true;
        cssObject.name = "map";

        Vis.cssScene.add(cssObject);
    }

}

function visualAnimationOrder(){

    if($('#checkbox-flow-order-time')[0].checked ){


        while(Vis.glScene.getObjectByName("flows3D")){
            var selectedObject = Vis.glScene.getObjectByName("flows3D");
            Vis.glScene.remove( selectedObject );
        }
        while(Vis.glScene.getObjectByName("OD")){
            var selectedObject = Vis.glScene.getObjectByName("OD");
            Vis.glScene.remove( selectedObject );
        }

        var tweenDaytime = null;

        initAnimation( animate);

        function initAnimation( callback) {

            var companys =["airiceland", "eagleair",  "norlandair"];
            var colorOrdinal = d3.scaleOrdinal(["#3fd464", "#ffd60d", "#0983ba" ]).domain(companys);

            var daylengthIn3DSecne = 50000;

            var position = { x : 0 };
            var minutes = 0;
            var daylength = 24*60;

            var sphereGeometry = new THREE.SphereGeometry( 32, 32, 32 );


            Vis.dataLocalFlights.forEach(function (d, i) {

                var pointO = projectionWorldtoVis([d.originloglat[1], d.originloglat[0]]);
                var pointD = projectionWorldtoVis([d.destloglat[1], d.destloglat[0]]);

                var origin = new THREE.Vector3( pointO[0] ,  pointO[1] , 1);
                var destination = new THREE.Vector3( pointD[0] , pointD[1] , 1);

                var ctrl1 = new THREE.Vector3( 3*pointO[0]/4 + pointD[0]/4 ,  (3*pointO[1]/4 + pointD[1]/4),   60 * 24 / 5);
                var ctrl2 = new THREE.Vector3( pointO[0]/4 + 3*pointD[0]/4, pointO[1]/4 + 3*pointD[1]/4 ,   60 * 24 / 5 );

                var curve = new THREE.CubicBezierCurve3(origin,ctrl1,ctrl2,destination);

                var material = new THREE.MeshLambertMaterial( {color: colorOrdinal(d.companyname) } );

                var timeArr1 = d.departure.split(":");
                var timeO = parseInt(timeArr1[0])*60 + parseInt(timeArr1[1]);
                var timeArr2 = d.arrival.split(":");
                var timeD = parseInt(timeArr2[0])*60 + parseInt(timeArr2[1]);

                var secondsAnimation = (timeD - timeO)/daylength * daylengthIn3DSecne;

                var sphere = new THREE.Mesh( sphereGeometry, material );

                var tween = new TWEEN.Tween( position /*,groupTweenFlows */)
                    .to({ x: 1 }, secondsAnimation)
                    .onStart(function () {

                        sphere.position.x = pointO[0];
                        sphere.position.y = pointO[1];
                        sphere.position.z = 0;
                        sphere.name = "animateOD" + i;
                        Vis.glScene.add( sphere );
                        
                    })
                    .onUpdate(function() {

                        var pos = curve.getPointAt( position.x );
                        sphere.position.x = pos.x;
                        sphere.position.y = pos.y;
                        sphere.position.z = pos.z;

                        if(position.x == 1){
                            var selectedObject = Vis.glScene.getObjectByName("animateOD" + i);
                            Vis.glScene.remove( selectedObject );
                        }
                        
                    })
                    .easing(TWEEN.Easing.Quadratic.Out)
                    .delay( timeO / daylength * daylengthIn3DSecne)
                    .start();

            });

            tweenDaytime = new TWEEN.Tween( position)
                .to({ x:  24 * 60 }, daylengthIn3DSecne)
                .onStart(function () {

                })
                .onUpdate(function() {
                    $("#timer").text(
                        Math.floor(position.x / 60)
                        + ":" + Math.floor(position.x % 60) );
                    minutes =  Math.floor(position.x % 60);
                })
                //.easing(TWEEN.Easing.Quadratic.Out)
                //.repeat(2)
                .start();

            setTimeout(callback, 200);

        }

        function animate( ){
            requestAnimationFrame(animate);
            //groupTweenFlows.update();
            TWEEN.update();
        }
    }
    else {

        TWEEN.getAll().forEach(function (value) { value.stop() });
        TWEEN.removeAll();

        while(Vis.glScene.getObjectByName("animateOD")){
            var selectedObject = Vis.glScene.getObjectByName("animateOD");
            Vis.glScene.remove( selectedObject );
        }

    }

}

function visualAnimationDuration(){

    if($('#checkbox-flow-duration-time')[0].checked ){

        while(Vis.glScene.getObjectByName("flows3D")){
            var selectedObject = Vis.glScene.getObjectByName("flows3D");
            Vis.glScene.remove( selectedObject );
        }

        while(Vis.glScene.getObjectByName("OD")){
            var selectedObject = Vis.glScene.getObjectByName("OD");
            Vis.glScene.remove( selectedObject );
        }

        var tweenDaytime = null;
        //var groupTweenFlows = new TWEEN.Group();

        initAnimation( animate);

        function initAnimation( callback) {

            var companys =["airiceland", "eagleair",  "norlandair"];
            var colorOrdinal = d3.scaleOrdinal(["#3fd464", "#ffd60d", "#0983ba" ]).domain(companys);

            var daylengthIn3DSecne = 50000;

            var position = { x : 0 };
            var minutes = 0;

            Vis.dataLocalFlights.forEach(function (d, i) {

                var pointO = projectionWorldtoVis([d.originloglat[1], d.originloglat[0]]);
                var pointD = projectionWorldtoVis([d.destloglat[1], d.destloglat[0]]);

                var origin = new THREE.Vector3( pointO[0] ,  pointO[1] , 1);
                var destination = new THREE.Vector3( pointD[0] , pointD[1] , 1);

                var ctrl1 = new THREE.Vector3( 3*pointO[0]/4 + pointD[0]/4 ,  (3*pointO[1]/4 + pointD[1]/4),   60 * 24 / 5);
                var ctrl2 = new THREE.Vector3( pointO[0]/4 + 3*pointD[0]/4, pointO[1]/4 + 3*pointD[1]/4 ,   60 * 24 / 5 );

                var curve = new THREE.CubicBezierCurve3(origin,ctrl1,ctrl2,destination);

                var material = new THREE.MeshLambertMaterial( {color: colorOrdinal(d.companyname) } );


                var timeArr1 = d.departure.split(":");
                var timeO = parseInt(timeArr1[0])*60 + parseInt(timeArr1[1]);
                var timeArr2 = d.arrival.split(":");
                var timeD = parseInt(timeArr2[0])*60 + parseInt(timeArr2[1]);
                var daylength = 24*60;
                var secondsAnimation = (timeD - timeO)/daylength * daylengthIn3DSecne;
                var position = { x: 0 };

                var tween = new TWEEN.Tween( position/*,groupTweenFlows */)
                    .to({ x: 1 }, secondsAnimation)
                    .onStart(function () {
                        var geometry = new THREE.TubeGeometry( curve, 64, 8 /*radius*/, 8, false );
                        var mesh = new THREE.Mesh( geometry, material );
                        mesh.name = "flows3D" + i;
                        Vis.glScene.add(mesh);
                    })
                    .onUpdate(function() {

                        if(position.x == 1){
                            var selectedObject = Vis.glScene.getObjectByName("flows3D" + i);
                            Vis.glScene.remove( selectedObject );
                        }
                    })
                    .onStop(function () {
                        var selectedObject = Vis.glScene.getObjectByName("flows3D" + i);
                        Vis.glScene.remove( selectedObject );
                    })
                    .easing(TWEEN.Easing.Quadratic.Out)
                    .delay( timeO / daylength * daylengthIn3DSecne)
                    .start();

            });

            tweenDaytime = new TWEEN.Tween( position)
                .to({ x:  24 * 60 }, daylengthIn3DSecne)
                .onUpdate(function() {
                    $("#timer").text(
                        Math.floor(position.x / 60)
                        + ":" + Math.floor(position.x % 60) );
                    minutes =  Math.floor(position.x % 60);
                })
                .start();
            setTimeout(callback, 200);

        }


        function animate( ){
            requestAnimationFrame(animate);
            //groupTweenFlows.update();
            TWEEN.update();
        }
    }
    else {
        TWEEN.getAll().forEach(function (value) { value.stop() });
        TWEEN.removeAll();

    }

}

function visualAnimationFrequency(){

    if($('#checkbox-flow-frequency-attrQT')[0].checked ){

        while(Vis.glScene.getObjectByName("flows3D")){
            var selectedObject = Vis.glScene.getObjectByName("flows3D");
            Vis.glScene.remove( selectedObject );
        }
        while(Vis.glScene.getObjectByName("OD")){
            var selectedObject = Vis.glScene.getObjectByName("OD");
            Vis.glScene.remove( selectedObject );
        }

        var frequencyScale = 10;

        initAnimation( animate);

        function initAnimation( callback) {

            var companys =["airiceland", "eagleair",  "norlandair"];
            var colorOrdinal = d3.scaleOrdinal(["#3fd464", "#ffd60d", "#0983ba" ]).domain(companys);

            Vis.dataLocalFlights.forEach(function (d, i) {

                var pointO = projectionWorldtoVis([d.originloglat[1], d.originloglat[0]]);
                var pointD = projectionWorldtoVis([d.destloglat[1], d.destloglat[0]]);

                var origin = new THREE.Vector3( pointO[0] ,  pointO[1] , 1);
                var destination = new THREE.Vector3( pointD[0] , pointD[1] , 1);

                var ctrl1 = new THREE.Vector3( 3*pointO[0]/4 + pointD[0]/4 ,  (3*pointO[1]/4 + pointD[1]/4),   60 * 24 / 5);
                var ctrl2 = new THREE.Vector3( pointO[0]/4 + 3*pointD[0]/4, pointO[1]/4 + 3*pointD[1]/4 ,   60 * 24 / 5 );

                var curve = new THREE.CubicBezierCurve3(origin,ctrl1,ctrl2,destination);

                var sphereGeometry = new THREE.SphereGeometry( 32, 32, 32 );

                var material = new THREE.MeshLambertMaterial( {color: colorOrdinal(d.companyname) } );
                var sphere = new THREE.Mesh( sphereGeometry, material );

                var secondsAnimation = 5000;
                var frequencyWeekly = d3.sum(d.dateweek);
                secondsAnimation = secondsAnimation/frequencyWeekly /frequencyScale;

                var position = { x: 0 };

                var tween = new TWEEN.Tween( position /*, groupTweenFlows*/)
                    .to({ x: 1 }, secondsAnimation)
                    .onStart(function () {
                        sphere.position.x = pointO[0];
                        sphere.position.y = pointO[1];
                        sphere.position.z = 0;
                        sphere.name = "animateOD" + i;
                        Vis.glScene.add( sphere );
                    })
                    .onUpdate(function() {
                        var pos = curve.getPointAt( position.x );
                        sphere.position.x = pos.x;
                        sphere.position.y = pos.y;
                        sphere.position.z = pos.z;
                    })
                    .repeat(Infinity)
                    .onStop(function () {
                        var selectedObject = Vis.glScene.getObjectByName( "animateOD" + i);
                        Vis.glScene.remove( selectedObject );
                    })
                    .easing(TWEEN.Easing.Quadratic.Out)
                    .start();
            });

            setTimeout(callback, 200);

        }

        function animate( ){
            requestAnimationFrame(animate);
            TWEEN.update();
        }
    }
    else{
        TWEEN.getAll().forEach(function (value) { value.stop() });
        TWEEN.removeAll();
    }

}

function projectionWorldtoVis(point) {
    var pointPlane = Vis.theMap.project( point);
    return [pointPlane.x - Vis.plane_origin.x, Vis.plane_origin.y - pointPlane.y  ];

}

function update() {

    Vis.controls.update();
    Vis.glRenderer.render(Vis.glScene, Vis.camera);
    Vis.cssRenderer.render(Vis.cssScene, Vis.camera);
    requestAnimationFrame(update);
}


//abandend
function updateVis(date) {

    while(Vis.glScene.getObjectByName("flows3D")){
        var selectedObject = Vis.glScene.getObjectByName("flows3D");
        Vis.glScene.remove( selectedObject );
    }

    flowmap3DTime(date);
    //flow3DBuilder( );

    update();
}

function flowmap3DTime(date){

    var companys =["airiceland", "eagleair",  "norlandair"];
    var colorOrdinal = d3.scaleOrdinal(["#3fd464",
        "#ffd60d",
        "#0983ba" ]).domain(companys);

    var height = 24*60;

    aixs(height);


    Vis.dataAirports.forEach(function (d,i) {


        var point = projectionWorldtoVis(  [ parseFloat( d[0] )  ,  parseFloat( d[1]) ]);
        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3( point[0],  point[1],  0 ));
        geometry.vertices.push(new THREE.Vector3( point[0],  point[1],  height ));
        var material = new THREE.LineBasicMaterial({  linewidth: 1 } );
        var line = new THREE.Line(geometry, material);
        line.name = "flows3D"
        Vis.glScene.add(line);


        //text, x, y, z, size, color, backGroundColor, backgroundMargin

        var str = Vis.airPortCodeList[i]
        var textmesh = createLabel(str, point[0] , point[1], 2, 40, "black", "yellow");
        Vis.glScene.add(textmesh);

        //var textmesh2 = createLabel("X", point[0] , point[1], height, 40, "black", "yellow");
        //Vis.glScene.add(textmesh2);
    });


    if(date == 7 ){

        Vis.dataLocalFlights.forEach(function (d) {

            var pointO = projectionWorldtoVis([d.originloglat[1], d.originloglat[0]]);
            var pointD = projectionWorldtoVis([d.destloglat[1], d.destloglat[0]]);

            var timeArr1 = d.departure.split(":");
            var timeO = parseInt(timeArr1[0])*60 + parseInt(timeArr1[1]);

            var timeArr2 = d.arrival.split(":");
            var timeD = parseInt(timeArr2[0])*60 + parseInt(timeArr2[1]);

            var geometry = new THREE.Geometry();
            geometry.vertices.push(new THREE.Vector3( pointO[0],  pointO[1],  timeO ));
            geometry.vertices.push(new THREE.Vector3( pointD[0],  pointD[1],  timeD ));

            var material = new THREE.LineBasicMaterial({ color: colorOrdinal(  d.companyname ),linewidth: 2 } );
            var line = new THREE.Line(geometry, material);
            line.name = "flows3D"
            Vis.glScene.add(line);

        });

    }
    else{

        Vis.dataLocalFlights.forEach(function (d) {

            if(d.dateweek[date]){

                console.log(d.dateweek[date]);

                var pointO = projectionWorldtoVis([d.originloglat[1], d.originloglat[0]]);
                var pointD = projectionWorldtoVis([d.destloglat[1], d.destloglat[0]]);

                var timeArr1 = d.departure.split(":");
                var timeO = parseInt(timeArr1[0])*60 + parseInt(timeArr1[1]);

                var timeArr2 = d.arrival.split(":");
                var timeD = parseInt(timeArr2[0])*60 + parseInt(timeArr2[1]);


                var geometry = new THREE.Geometry();

                geometry.vertices.push(new THREE.Vector3( pointO[0],  pointO[1],  timeO ));
                geometry.vertices.push(new THREE.Vector3( pointD[0],  pointD[1],  timeD ));

                var material = new THREE.LineBasicMaterial({ color: colorOrdinal(  d.companyname ),linewidth: 2 } );
                var line = new THREE.Line(geometry, material);
                line.name = "flows3D"
                Vis.glScene.add(line);
            }

        });

    }



    function aixs(height) {
        var material = new THREE.LineBasicMaterial({ color: "#165686" });
        var geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3( -Vis.mapWidth/2,  Vis.mapHeight/2, height),
            new THREE.Vector3( -Vis.mapWidth/2,  Vis.mapHeight/2, 0),
            new THREE.Vector3(  Vis.mapWidth/2,  Vis.mapHeight/2, 0),
            new THREE.Vector3(  Vis.mapWidth/2,  Vis.mapHeight/2, height),
            new THREE.Vector3( -Vis.mapWidth/2,  Vis.mapHeight/2, height),
            new THREE.Vector3( -Vis.mapWidth/2, -Vis.mapHeight/2, height),
            new THREE.Vector3( -Vis.mapWidth/2, -Vis.mapHeight/2, 0)
        );

        var line = new THREE.Line( geometry, material );
        Vis.glScene.add( line );
    }


    function createLabel(text, x, y, z, size, color, backGroundColor, backgroundMargin) {


        if(!backgroundMargin)
            backgroundMargin = 50;
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");
        context.font = size + "pt Arial";
        var textWidth = context.measureText(text).width;
        canvas.width = textWidth + backgroundMargin;
        canvas.height = size + backgroundMargin;
        context = canvas.getContext("2d");
        context.font = size + "pt Arial";
        if(backGroundColor) {
            context.fillStyle = backGroundColor;
            context.fillRect(canvas.width / 2 - textWidth / 2 - backgroundMargin / 2, canvas.height / 2 - size / 2 - +backgroundMargin / 2, textWidth + backgroundMargin, size + backgroundMargin);
        }
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = color;
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        // context.strokeStyle = "black";
        // context.strokeRect(0, 0, canvas.width, canvas.height);
        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        var material = new THREE.MeshBasicMaterial({
            map : texture
        });
        var mesh = new THREE.Mesh(new THREE.PlaneGeometry(canvas.width, canvas.height), material);
        // mesh.overdraw = true;
        mesh.doubleSided = true;
        //mesh.position.x = x - canvas.width;
        //mesh.position.y = y - canvas.height;

        mesh.position.x = x;
        mesh.position.y = y ;
        mesh.position.z = z;
        return mesh;
    }

}