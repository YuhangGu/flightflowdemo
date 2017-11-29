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
    //mapZ: 2400,

    // base map
    theMap : null,
    map_center : {lat: 0 , lng: 0},
    map_scale : 3,
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
    minListA2 :  []

}

function designInit() {

    init3DScene(function () {
        initGeo ( );
        dataProcessing( function () {
            initHTML();
        });
    });
}

function initHTML() {

    Vis.datascaleArr = [
        [1,1], //none
        [d3.min(Vis.minListtime), d3.max(Vis.maxListtime)], // time
        [d3.min(Vis.minListheight), d3.max(Vis.maxListheight)], // height
        [d3.min(Vis.minListA1), d3.max(Vis.maxListA1)], //speed
        [d3.min(Vis.minListA2), d3.max(Vis.maxListA2)] //speed
    ];
    
    updateVis();

    $("#selector3D").change(function (e) {
        Vis.visualVarablesArr[0] = $("#selector3D option:selected").val();
        updateVis();
    });

    $("#selectorColor").change(function (e) {
        Vis.visualVarablesArr[1] = $("#selectorColor option:selected").val();
        updateVis();
    });

    $("#selectorLinewidth").change(function (e) {
        Vis.visualVarablesArr[2] = $("#selectorLinewidth option:selected").val();
        updateVis();
    });

    $("#mapstyle").change(function (e) {
        var styleIndex = $("#mapstyle option:selected").val();

        console.log("styleIndex", styleIndex);
    });

}

function updateVis() {

    // clear the old object first
    while(Vis.glScene.getObjectByName("flows3D")){
        var selectedObject = Vis.glScene.getObjectByName("flows3D");
        Vis.glScene.remove( selectedObject );
    }

    flow3DBuilder( );
    update();
}


function dataProcessing(callback) {

    d3.json("data/allflights.json", function(error, data){

        data.forEach( function(item){
            var pointList = [];
            var timeList  = item.time;
            var heightList = item.altitude;
            var attr1List = item.speed;
            var attr2List = item.speed;

            for(var i = 0; i < item.geometry.length; i ++){
                var point = projectionWorldtoVis(item.geometry[i]);
                pointList.push([ point[0], point[1] ]);
            }

            var dataItem = [
                pointList,
                timeList,
                heightList,
                attr1List,
                attr2List
            ];

            Vis.datasetArr.push(dataItem);

            Vis.maxListtime.push(d3.max(timeList));
            Vis.minListtime.push(d3.min(timeList));

            Vis.maxListheight.push(d3.max(heightList));
            Vis.minListheight.push(d3.min(heightList));

            Vis.maxListA1.push(d3.max(attr1List));
            Vis.minListA1.push(d3.min(attr1List));

            Vis.maxListA2.push(d3.max(attr2List));
            Vis.minListA2.push(d3.min(attr2List));
        });

    });

    function projectionWorldtoVis(point) {
        var pointPlane = Vis.theMap.project( L.latLng(point[0], point[1] ));
        return [pointPlane.x - Vis.plane_origin.x - Vis.mapWidth/2,
            2 * Vis.plane_center.y - pointPlane.y - Vis.plane_origin.y - Vis.mapHeight/2];
    }

    function projectionWorldtoVis_forMinard (point) {
        var pointPlane = Vis.theMap.project( L.latLng(point.Latitude, point.Longitude ));

        return [pointPlane.x - Vis.plane_origin.x - Vis.mapWidth/2,
            2 * Vis.plane_center.y - pointPlane.y - Vis.plane_origin.y - Vis.mapHeight/2];
    }

    setTimeout(callback, 200);
}

function dataProcessing_with_Minard_Data(callback) {

    d3.json("data/minardData.json", function(error, data){

        var maxListtime = [];
        var minListtime = [];
        var maxListA1 = [];
        var minListA1 = [];
        var maxListA2 = [];
        var minListA2 = [];

        data.features.forEach(function(item){

            var pointList = [];
            var timeList = [];
            var attr1List = [];
            var attr2List = [];

            //fake data for the spatial Z
            var heightList = [];

            item.attribute.forEach(function (d) {

                var point = projectionWorldtoVis(d);

                pointList.push([ point[0], point[1] ]);
                timeList.push(parseInt(d.Day));
                attr1List.push(parseInt(d.Temperature));
                attr2List.push(parseInt(d.Troops));
                heightList.push(100);

            });


            maxListtime.push(d3.max(timeList));
            minListtime.push(d3.min(timeList));
            maxListA1.push(d3.max(attr1List));
            minListA1.push(d3.min(attr1List));
            maxListA2.push(d3.max(attr2List));
            minListA2.push(d3.min(attr2List));


            var dataItem = [  pointList,
                timeList,
                heightList,
                attr1List,
                attr2List
            ];

            Vis.datasetArr.push(dataItem);

        });


        Vis.datascaleArr = [
            [1,1], //none
            [d3.min(minListtime), d3.max(maxListtime)], // time
            [0,200], // height
            [d3.min(minListA1), d3.max(maxListA1)], //tempreature
            [d3.min(minListA2), d3.max(maxListA2)] //troops
        ];


    });

    function projectionWorldtoVis(point) {
        var pointPlane = Vis.theMap.project( L.latLng(point.Latitude, point.Longitude ));

        return [pointPlane.x - Vis.plane_origin.x - Vis.mapWidth/2,
            2 * Vis.plane_center.y - pointPlane.y - Vis.plane_origin.y - Vis.mapHeight/2];
    }

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

    update();

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
    creatTheAixs();

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

function update() {
    Vis.controls.update();
    Vis.glRenderer.render(Vis.glScene, Vis.camera);
    Vis.cssRenderer.render(Vis.cssScene, Vis.camera);
    requestAnimationFrame(update);
}

// X_Y, Z, Color, Volume
function flow3DBuilder(  ){



    //console.log(Vis.minListtime);

    var thirdIndex = Vis.visualVarablesArr[0];
    var colorIndex = Vis.visualVarablesArr[1];
    var volumeIndex = Vis.visualVarablesArr[2];


    var thridDlinear = d3.scale.linear().domain(  Vis.datascaleArr[thirdIndex] )
        .range([ 0, Vis.mapZ]);

    var colorlinear = d3.scale.linear().domain( Vis.datascaleArr[colorIndex] )
        .range([ "blue","red"]);

    //Vis.trooplinear = d3.scale.linear().domain(volumescale).range([2, 20]);
    var volumescale = d3.scale.linear().domain( Vis.datascaleArr[volumeIndex])
        .range([0, 80]);


    var colorOrdinal = d3.scaleOrdinal(["#fe8173", "#beb9d9", "#b1df71", "#fecde5", "#ffffb8", "#feb567", "#8ad4c8", "#7fb0d2",
        "#fe8173", "#beb9d9", "#b1df71", "#fecde5", "#ffffb8", "#feb567", "#8ad4c8", "#7fb0d2",
        "#fe8173", "#beb9d9", "#b1df71", "#fecde5", "#ffffb8", "#feb567", "#8ad4c8", "#7fb0d2",
        "#fe8173", "#beb9d9", "#b1df71"])
        .domain(Vis.datasetArr);


    //create objects for every of these three troops
    Vis.datasetArr.forEach( function (dataItem, i) {

        var vertices = dataItem[0];

        var heightArray = dataItem[thirdIndex];
        var colorArray =  dataItem[colorIndex];
        var volumeArray =  dataItem[volumeIndex];

        var geometry = new THREE.Geometry();

        for(var i = 0; i < dataItem[0].length; i ++){
            geometry.vertices.push(new THREE.Vector3(vertices[i][0],  vertices[i][1],  thridDlinear(heightArray[ i ])));
        }


        var material = new THREE.LineBasicMaterial({ color: colorOrdinal(dataItem), linewidth: 5 } );
        var line = new THREE.Line(geometry, material);
        line.name = "flows3D"
        Vis.glScene.add(line);
    });

    //return segments;
}

function flow3DBuilder_old(vertices, heightArray, heightScale,
                        colorArray, colorscale,  volumeArray, volumescale){

    //console.log("heightScale", heightScale,"colorscale",colorscale,"volumescale",volumescale);

    var geometry, material, mesh;

    var thridDlinear = d3.scale.linear().domain( heightScale )
        .range([ 0, Vis.mapZ]);

    var colorlinear = d3.scale.linear().domain( colorscale )
        .range([ "blue","red"]);


    //Vis.trooplinear = d3.scale.linear().domain(volumescale).range([2, 20]);
    var volumescale = d3.scale.linear().domain( volumescale)
        .range([0, 80]);

    var segments = new THREE.Object3D();

    for (var i = 1, len = vertices.length - 1; i < len; i++) {

        var path = new THREE.CatmullRomCurve3([ new THREE.Vector3(vertices[i-1][0], vertices[i-1][1], thridDlinear(heightArray[i-1]) ),
            new THREE.Vector3(vertices[ i ][0], vertices[ i ][1], thridDlinear(heightArray[ i ] )),
            new THREE.Vector3(vertices[i+1][0], vertices[i+1][1], thridDlinear(heightArray[i+1])  ) ]);


        var color = colorlinear(colorArray[i]);

        geometry = new THREE.TubeGeometry(path, 4, volumescale(volumeArray[i]), 16);
        material = new THREE.MeshLambertMaterial({ opacity: 1, transparent: true,
            color: color });

        mesh = new THREE.Mesh(geometry, material)
        segments.add(mesh);
    }

    segments.castShadow = true;
    segments.receiveShadow = true;

    return segments;
}