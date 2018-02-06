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
    dataLocalFlights: null
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


    /*
    Vis.datascaleArr = [
        [1,1], //none
        [d3.min(Vis.minListtime), d3.max(Vis.maxListtime)], // time
        [d3.min(Vis.minListheight), d3.max(Vis.maxListheight)], // height
        [d3.min(Vis.minListA1), d3.max(Vis.maxListA1)], //speed
        [d3.min(Vis.minListA2), d3.max(Vis.maxListA2)] //speed
    ];
    */

    updateVis(0);

    $("#selector3D").change(function (e) {


        Vis.visualVarablesArr[0] = $("#selector3D option:selected").val();

        var selectedType =  $("#selector3D option:selected").val();
        //console.log('selectedType', selectedType);
        updateVis(selectedType);

    });

}

function updateVis(typeIndex) {

    while(Vis.glScene.getObjectByName("flows3D")){
        var selectedObject = Vis.glScene.getObjectByName("flows3D");
        Vis.glScene.remove( selectedObject );
    }

    flowmap3DTime();
    //flow3DBuilder( );

    update();
}

function flowmap3DTime(){


    console.log(Vis.airportsDictionary);

    var colorOrdinal = d3.scaleOrdinal(["#fe8173", "#beb9d9", "#b1df71", "#fecde5", "#ffffb8", "#feb567", "#8ad4c8", "#7fb0d2",
        "#fe8173", "#beb9d9", "#b1df71", "#fecde5", "#ffffb8", "#feb567"])
        .domain(Vis.dataAirportNames);

    var height = 24*60;

    aixs(height);

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


    Vis.dataAirports.forEach(function (d,i) {

        var point = projectionWorldtoVis(  [ parseFloat( d[0] )  ,  parseFloat( d[1]) ]);
        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3( point[0],  point[1],  0 ));
        geometry.vertices.push(new THREE.Vector3( point[0],  point[1],  height ));
        var material = new THREE.LineBasicMaterial({ color: colorOrdinal(Vis.dataAirportNames[i]), linewidth: 1 } );
        var line = new THREE.Line(geometry, material);
        line.name = "flows3D"
        Vis.glScene.add(line);
    });



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

        var material = new THREE.LineBasicMaterial({ linewidth: 2 } );
        var line = new THREE.Line(geometry, material);
        line.name = "flows3D"
        Vis.glScene.add(line);

    });


    function projectionWorldtoVis(point) {

        var pointPlane = Vis.theMap.project( L.latLng(point[0], point[1] ));
        return [pointPlane.x - Vis.plane_origin.x - Vis.mapWidth/2,
            2 * Vis.plane_center.y - pointPlane.y - Vis.plane_origin.y - Vis.mapHeight/2];
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

function update() {
    Vis.controls.update();
    Vis.glRenderer.render(Vis.glScene, Vis.camera);
    Vis.cssRenderer.render(Vis.cssScene, Vis.camera);
    requestAnimationFrame(update);
}
