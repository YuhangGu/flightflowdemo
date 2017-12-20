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

    //
    matrixAll: null,
    airportsPos : [],
    maxWholeWeek:0,

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

    flow3DBuilderWithMatrix( );

    update();
}

function dataProcessing(callback) {

    d3.json("data/icelandMatrixs.json", function(error, data){

        Vis.matrixAll = data.matrixWholeweek;
        Vis.airportsPos = data.airportsGeo;
        Vis.maxWholeWeek = data.maxall;

        Vis.airportsPos = Vis.airportsPos.map(function (d) {
            var point = projectionWorldtoVis([ parseFloat(d[0]) , parseFloat(d[1])]);
            return [ point[0] , point[1] ,parseFloat(d[2]) ];
        });

    });

    function projectionWorldtoVis(point) {

        var pointPlane = Vis.theMap.project( L.latLng(point[0], point[1] ));
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
    directionalLight1.position.set(0, -2000, 3000).normalize();
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



function flow3DBuilderWithMatrix(  ){


    var rowsum = Vis.matrixAll.map(function (d) {

        var sum = d.reduce(function(a, b) {
            return a+b;
        });
        return sum;
    });

    var thridDlinear = d3.scaleLinear().range([ 0, Vis.mapZ]).domain( [0, d3.max(rowsum)] );

    //console.log(rowsum);

    //var colorlinear = d3.scaleLinear().domain( Vis.datascaleArr[colorIndex] ).range([ "blue","red"]);
    //Vis.trooplinear = d3.scaleLinear().domain(volumescale).range([2, 20]);
    //var volumescale = d3.scaleLinear().domain( Vis.datascaleArr[volumeIndex]) .range([0, 80]);
    //var colorOrdinal = d3.scaleOrdinal(["#fe8173", "#beb9d9", "#b1df71", "#fecde5"]).domain(Vis.datasetArr);
    //create objects for every of these three troops


    Vis.airportsPos.forEach(function (d,i) {

        var geometry = new THREE.BoxGeometry( 10, 10, thridDlinear(rowsum[i]) );
        var material = new THREE.MeshLambertMaterial( {color: 0x0A6187} );
        var cube = new THREE.Mesh( geometry, material );
        cube.position.x = d[0];
        cube.position.y = d[1];
        cube.position.z = thridDlinear(rowsum[i])/2;
        cube.name = "flows3D"
        Vis.glScene.add( cube );

    });

    /*
    Vis.matrixAll.forEach(function (rows, i) {

        rows.forEach(function (d, j) {
            if(Vis.matrixAll[i][j] != 0 ){
                createFlow(Vis.airportsPos[i],Vis.airportsPos[j], thridDlinear(Vis.matrixAll[i][j]) );
            }
        } );

    });
    */

    var posrecorder = new Array(Vis.matrixAll.length);
    posrecorder.fill(0);

    for(var i = 0; i < Vis.matrixAll.length; i++){

        for(var j = 0; j < Vis.matrixAll.length; j++){

            if(Vis.matrixAll[i][j] != 0 ){
                createFlow(Vis.airportsPos[i],Vis.airportsPos[j], posrecorder[i], thridDlinear(Vis.matrixAll[i][j]) );
                posrecorder[i] =  posrecorder[i] + thridDlinear(Vis.matrixAll[i][j]);
            }
        }
    }
    
    
    function createFlow( origin , destination, pos , height) {

        var geo = new THREE.Geometry();


        geo.vertices.push(new THREE.Vector3(origin[0],origin[1],pos));
        geo.vertices.push(new THREE.Vector3(destination[0],destination[1],pos));
        geo.vertices.push(new THREE.Vector3(destination[0],destination[1],pos + height));
        geo.vertices.push(new THREE.Vector3(origin[0],origin[1], pos + height));

        geo.faces.push( new THREE.Face3(0,1,2));
        geo.faces.push( new THREE.Face3(2,1,0));
        geo.faces.push( new THREE.Face3(2,3,0));
        geo.faces.push( new THREE.Face3(0,3,2));

        var material = new THREE.MeshBasicMaterial( { color: 0xE8007A ,side: THREE.FrontSide, opacity:0.5} );
        var mesh = new THREE.Mesh( geo, material );
        mesh.name = "flows3D";
        Vis.glScene.add( mesh );

    }





    //return segments;
}
// X_Y, Z, Color, Volume
function flow3DBuilder_bak(  ){

    //console.log(Vis.minListtime);

    var thirdIndex = Vis.visualVarablesArr[0];
    var colorIndex = Vis.visualVarablesArr[1];
    var volumeIndex = Vis.visualVarablesArr[2];


    var thridDlinear = d3.scaleLinear().range([ 0, Vis.mapZ]).domain(  Vis.datascaleArr[thirdIndex] );

    var colorlinear = d3.scaleLinear().domain( Vis.datascaleArr[colorIndex] ).range([ "blue","red"]);

    //Vis.trooplinear = d3.scaleLinear().domain(volumescale).range([2, 20]);
    var volumescale = d3.scaleLinear().domain( Vis.datascaleArr[volumeIndex]) .range([0, 80]);


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