/**
 * Created by Aero on 14/11/2017.
 */
L.mapbox.accessToken = 'pk.eyJ1IjoiaXRjYWVybyIsImEiOiJjaWxuZmtlOHQwMDA2dnNseWMybHhvMXh0In0.DObc4iUf1_86LxJGF0RHog';

var Vis = {
    //doc div parameters
    canvasWidth: window.innerWidth,
    canvasHeight: window.innerHeight,

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
    map_scale : 8,
    plane_center: null,
    plane_origin: null,

    //flows
    verticts2D: [],

    //data
    // <option value="0">none only 2D</option>
    // <option value="1">time</option>
    // <option value="2">height</option>
    // <option value="3">tempreature</option>
    // <option value="4">troops</option>
    datasetArr : [],
    //datascaleArr : [],

    datascaleArr : null,
    //data component
    /*
     * 0 : none
     * 1 : time
     * 2 : height
     * 3 : tempreature
     * 4 : troops
     */

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

function designInit() {

    init3DScene(function () {

        initGeo ( );

        dataProcessing( function () {

            initHTML(function () {
                initVisualization();
            });

        });

    });
}

function initHTML(callback) {


    //updateVis(7);

    /*
    $("#selector3D").change(function (e) {


        Vis.visualVarablesArr[0] = $("#selector3D option:selected").val();

        var selectedType =  $("#selector3D option:selected").val();
        //console.log('selectedType', selectedType);
        updateVis(selectedType);
    });
    */


    $('input[name="radio3D"]').change(function (e) {
        var checkboxValue =  $('input[name="radio3D"]:checked').val();
        redrawOD(checkboxValue);
    });

    $('input[name="radioFlow"]').change(function (e) {
        var checkboxValue =  $('input[name="radioFlow"]:checked').val();
        redrawFlows(checkboxValue);
    });


    //flows changing color

    $('input[name="radioFlowColor"]').change(function (e) {
        var checkboxValue =  $('input[name="radioFlow"]:checked').val();
        redrawFlows(checkboxValue);
    });

    //flows changing size
    $('#checkbox-flow-size-link').change(function (e) {
        redrawFlows(  $('input[name="radioFlow"]:checked').val() );
    });
    $('#checkbox-flow-size-height').change(function (e) {
        redrawFlows(  $('input[name="radioFlow"]:checked').val() );
    });
    $('#checkbox-flow-size-time').change(function (e) {
        redrawFlows(  $('input[name="radioFlow"]:checked').val() );
    });
    $('#checkbox-flow-size-attrQL').change(function (e) {
        redrawFlows(  $('input[name="radioFlow"]:checked').val() );
    });
    $('#checkbox-flow-size-attrQT').change(function (e) {
        redrawFlows(  $('input[name="radioFlow"]:checked').val() );
    });

    $('#checkbox-flow-animation-link').change(function (e) {
        //redrawFlows(  $('input[name="radioFlow"]:checked').val() );

        visualAnimation();

    });


    setTimeout(callback, 200);
}

function initVisualization() {


    var companys =["airiceland", "eagleair",  "norlandair"];
    var colorOrdinal = d3.scaleOrdinal(["#3fd464",
        "#ffd60d",
        "#0983ba" ]).domain(companys);

    var height = 24*60;

    createAixs(height);
    createLabels();

    redrawOD('point');
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

    d3.json("data/icelandlocal.json", function(error, data){

        Vis.dataAirportNames = data.airportsDictionary;
        Vis.dataAirports = data.airportsGeo;
        Vis.dataLocalFlights = data.flights;

    });

    setTimeout(callback, 200);
}

function init3DScene(callback) {


    Vis.camera = new THREE.PerspectiveCamera( 50, Vis.canvasWidth / Vis.canvasHeight, 0.1, 10000);
    Vis.camera.position.set(0, -5000, 3000)

    //reate two renders
    Vis.glRenderer = createGlRenderer();
    Vis.cssRenderer = createCssRenderer();

    var mapdiv = document.getElementById("visDiv");
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
        Vis.glScene.add(mesh);

        d3.selectAll('.map-div')
            .data([1]).enter()
            .append("div")
            .attr("class", "map-div")
            .attr("id","mappad")
            .each(function (d) {
                var map = L.mapbox.map("mappad", Vis.mapstyles[12]).setView([Vis.map_center.lat, Vis.map_center.lng],Vis.map_scale);
                Vis.theMap = map;
                Vis.plane_origin = Vis.theMap.getPixelOrigin();
                Vis.plane_center = Vis.theMap.project(L.latLng(Vis.map_center.lat, Vis.map_center.lng));
            });

        var mapcontener = document.getElementById("mappad");
        var cssObject = new THREE.CSS3DObject(mapcontener);
        cssObject.position.x = 0;
        cssObject.position.y = 0;
        cssObject.position.z = 0;
        cssObject.receiveShadow	= true;

        Vis.cssScene.add(cssObject);
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

    var flowchecksizeAttr = $('#checkbox-flow-size-attrQT')[0].checked;

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
                    material = new THREE.MeshLambertMaterial({ color: "#ffffff" } );
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
                    material = new THREE.MeshLambertMaterial({ color: "#ffffff" } );
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
                    material = new THREE.MeshLambertMaterial({ color: "#ffffff" } );
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
                    material = new THREE.MeshLambertMaterial({ color: "#ffffff" } );
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
                    material = new THREE.MeshLambertMaterial({ color: "#ffffff" } );
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

function visualAnimation(){

    if($('#checkbox-flow-animation-link')[0].checked ){

        var tweenDaytime = null;
        var groupTweenFlows = new TWEEN.Group();

        initAnimation( animate);

        function initAnimation( callback) {

            var companys =["airiceland", "eagleair",  "norlandair"];
            var colorOrdinal = d3.scaleOrdinal(["#3fd464", "#ffd60d", "#0983ba" ]).domain(companys);

            var daylengthIn3DSecne = 50000;

            var position = { x : 0 };
            var minutes = 0;

            Vis.dataLocalFlights.forEach(function (d) {
                //console.log(d);

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

                sphere.position.x = pointO[0];
                sphere.position.y = pointO[1];
                sphere.position.z = 0;
                sphere.name = "animateOD"

                Vis.glScene.add( sphere );


                var timeArr1 = d.departure.split(":");

                var timeO = parseInt(timeArr1[0])*60 + parseInt(timeArr1[1]);

                var timeArr2 = d.arrival.split(":");
                var timeD = parseInt(timeArr2[0])*60 + parseInt(timeArr2[1]);

                var daylength = 24*60;

                //start from 3h
                //timeO = timeO - 3*60;
                //timeD = timeD - 3*60;

                //var daylengthIn3DSecne = 50000;
                var secondsAnimation = (timeD - timeO)/daylength * daylengthIn3DSecne;

                var position = { x: 0 };

                var tween = new TWEEN.Tween( position,groupTweenFlows )
                    .to({ x: 1 }, secondsAnimation)
                    .onUpdate(function() {
                        var pos = curve.getPointAt( position.x );
                        sphere.position.x = pos.x;
                        sphere.position.y = pos.y;
                        sphere.position.z = pos.z;
                        //console.log(position.x);
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
            groupTweenFlows.update();
            TWEEN.update();
        }
    }

}


function projectionWorldtoVis(point) {

    var pointPlane = Vis.theMap.project( L.latLng(point[0], point[1] ));
    return [pointPlane.x - Vis.plane_origin.x - Vis.mapWidth/2,
        2 * Vis.plane_center.y - pointPlane.y - Vis.plane_origin.y - Vis.mapHeight/2];
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