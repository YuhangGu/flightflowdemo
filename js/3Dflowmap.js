/**
 * Created by Aero on 14/02/2017.
 */
$(document).ready(function(){

    //define the window
    var windowdiv_width = $("#flow-map-3D").width();
    var windowdiv_height = 800;


    //parameters for the sence
    var controls, camera, glScene, cssScene, glRenderer, cssRenderer;

    //parameters for the graphic
    var map_length = 2800, map_width = 2400, map_height = 2400;

    var projection = d3.geo.azimuthalEquidistant()
        .scale(360)
        .translate([map_length / 2, map_width / 2])
        .clipAngle(180 - 1e-3)
        .precision(.1);

    d3.selectAll('.map-div')
        .data([1]).enter()
        .append("div")
        .attr("class", "map-div")
        .attr("id","map_container");

    var svg = d3.select("#map_container").append("svg")
        .attr("id","svg_flow_3D")
        .attr("width", map_length)
        .attr("height", map_width)
        .attr("transform", "rotate(0,180,180)");

    //Define path generator
    var path = d3.geo.path().projection(projection);

    initialize();

    //------------------definitions-------------
    function initialize() {

        camera = new THREE.PerspectiveCamera(
            50,
            windowdiv_width / windowdiv_height,
            0.1,
            10000);

        camera.position.set(0, -3000, 3500)

        //reate two renders
        glRenderer = createGlRenderer();
        cssRenderer = createCssRenderer();

        var mapdiv = document.getElementById("flow-map-3D");
        mapdiv.appendChild(cssRenderer.domElement);
        cssRenderer.domElement.appendChild(glRenderer.domElement);
        glRenderer.shadowMap.enabled = true;
        glRenderer.shadowMap.type = THREE.PCFShadowMap;
        glRenderer.shadowMapAutoUpdate = true;


        glScene = new THREE.Scene();
        cssScene = new THREE.Scene();

        var ambientLight = new THREE.AmbientLight(0x445555);
        glScene.add(ambientLight);
        var directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set( 1000, -2, 10 ).normalize();
        glScene.add(directionalLight);

        createMap();
        createFlows();

        controls = new THREE.TrackballControls(camera,cssRenderer.domElement);
        controls.rotateSpeed = 2;
        controls.minDistance = 30;
        controls.maxDistance = 8000;

        update();
    }

    function createMap() {

        //create the plane where map is located
        var material = new THREE.MeshBasicMaterial({
            color: 0x000000,
            opacity: 0.0,
            side: THREE.DoubleSide
        });

        var geometry = new THREE.PlaneGeometry(map_length, map_width);

        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = 0;
        mesh.position.y = 0;
        mesh.position.z = 0;
        mesh.receiveShadow	= true;

        glScene.add(mesh);

        var g_basemap = svg.append("g")
            .attr("class","basemap3D");

        d3.json("../data/world-110m.json", function (error, world) {
            g_basemap.append("path", ".circle")
                .datum(topojson.object(world, world.objects.land))
                .attr("class", "basemap")
                .attr("d", path);
        });

        var map_container = document.getElementById("map_container");

        var cssObject = new THREE.CSS3DObject(map_container);
        cssObject.position.x = 0, cssObject.position.y = 0, cssObject.position.z = 0;
        cssObject.receiveShadow	= true;
        cssScene.add(cssObject);

    }


    function createFlows() {
        //mapbox polyline options

        d3.json("../data/arrivalflows.json", function (flights) {

            flights.features.forEach(function(d,i){

                var b;
                if(d.properties.origin == "KEF") {b = -1;}
                else if(d.properties.destination == "KEF") {b = 1;}

                //var pointtest = [-22.605556, 63.985];

                var numPoints = 100;

               // var interpoint = insertMiddlePoint(point_start, point_end, b);

                var spline = new THREE.CatmullRomCurve3(createCureArray(d.geometry.coordinates, b));

                var color = getColor(b);

                var material = new THREE.LineBasicMaterial({
                    color: color,
                });

                var geometry = new THREE.Geometry();

                var splinePoints = spline.getPoints(numPoints);
                for(var i = 0; i < splinePoints.length; i++){
                    geometry.vertices.push(splinePoints[i]);
                }

                var line = new THREE.Line(geometry, material);
                glScene.add(line);

            });


        });

    }

    function createGlRenderer() {
        var glRenderer = new THREE.WebGLRenderer({alpha:true});
        glRenderer.setClearColor(0xFFFFFF);
        glRenderer.setPixelRatio(window.devicePixelRatio);
        glRenderer.setSize(windowdiv_width, windowdiv_height);
        glRenderer.domElement.style.position = 'absolute';
        glRenderer.domElement.style.zIndex = 1;
        glRenderer.domElement.style.top = 0;
        return glRenderer;
    }

    function createCssRenderer() {

        var cssRenderer = new THREE.CSS3DRenderer();
        cssRenderer.setSize(windowdiv_width, windowdiv_height);
        glRenderer.domElement.style.zIndex = 0;
        cssRenderer.domElement.style.top = 0;
        return cssRenderer;
    }


    function createCureArray(location, b){

        var point_start = projection(location[0]),
            point_end = projection(location[1]);

        point_start[0] = point_start[0] - map_length/2;
        point_start[1] = map_width/2 - point_start[1];
        point_end[0]   = point_end[0] - map_length/2;
        point_end[1]   =  map_width/2 - point_end[1];

        var interpoint =  new THREE.Vector3( (point_start[0]+point_end[0])/2, (point_start[1]+point_end[1])/2,
                                    b*200);
        return [new THREE.Vector3(point_start[0] ,point_start[1],0),  interpoint,
            new THREE.Vector3(point_end[0],point_end[1], 0) ];

    }

    function  getColor(b){
        var color;
        if (b == 1){
           return 0xc3a130;
        }
        else if(b == -1)
        {
            return 0x46b39d;
        }
    }

    function update() {
        controls.update();
        cssRenderer.render(cssScene, camera);
        glRenderer.render(glScene, camera);
        requestAnimationFrame(update);
    }

});
