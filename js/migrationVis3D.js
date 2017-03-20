/**
 * Created by Aero on 23/02/2017.
 */
var graphics3D = {

    //doc div parameters
    windowdiv_width: $("#migration-flowmap-3D").width(),
    windowdiv_height: 400,
    windowdiv_width_3DM: $("#migration-3D-matrix").width(),
    windowdiv_height_3DM: 400,

    //graphic elements
    svg3DbaseMap: null,
    projection: null,

    //3D sence
    camera: null,
    glScene: null,
    cssScene: null,
    glRenderer: null,
    cssRenderer: null,
    controls: null,
    unitline3D: 300,

    //
    linerValueScale : null,

    //3D for matrix
    camera_3DM: null,
    glScene_3DM: null,
    cssScene_3DM: null,
    glRenderer_3DM: null,
    controls_3DM: null,

    //2D graphic
    map_length: 2800,
    map_width: 2400,
    map_height: 2400,

    map_length_3DM: 1600,
    map_width_3DM: 1600,

    //other
    centerMap: d3.map()
}

function draw3DFlowMap() {
    initialize();
    draw3DBaseMap();
    draw3DFlows();
}

function initialize() {

    d3.selectAll('.migration_map_div')
        .data([1]).enter()
        .append("div")
        .attr("class", "migration_map_div")
        .attr("id", "map_container_1");

    graphics3D.svg3DbaseMap = d3.select("#map_container_1").append("svg")
        .attr("id", "svg_flow_3D_1")
        .attr("width", graphics3D.map_length)
        .attr("height", graphics3D.map_width)
        .attr("transform", "rotate(0,180,180)")
        .attr("transform", "translate(" + graphics3D.map_width / 2 + "," + graphics3D.map_height / 2 + ")");


    var max_overall = [];
    migrationmatrix.forEach(function(d,i){
        if(i!=0){
            max_overall.push(d3.max(d));
        }
    });
    graphics3D.linerValueScale = d3.scaleLinear().domain([0,d3.max(max_overall)]).range([0,10]);

    graphics3D.projection = d3.geo.stereographic()
        .scale(40000)
        .center(graphics2D.icelandCenter)
        .translate([graphics3D.map_length / 2, graphics3D.map_width / 2])
        .rotate([0, 0])
        .clipAngle(180 - 1e-4)
        .clipExtent([[0, 0], [graphics3D.map_width, graphics3D.map_height]])
        .precision(.1);

    graphics3D.camera = new THREE.PerspectiveCamera(
        50,
        graphics3D.windowdiv_width / graphics3D.windowdiv_height,
        0.1,
        10000);

    graphics3D.camera.position.set(0, -3000, 3500)

    //reate two renders
    graphics3D.glRenderer = createGlRenderer();
    graphics3D.cssRenderer = createCssRenderer();


    var mapdiv = document.getElementById("migration-flowmap-3D");
    mapdiv.appendChild(graphics3D.cssRenderer.domElement);
    graphics3D.cssRenderer.domElement.appendChild(graphics3D.glRenderer.domElement);
    graphics3D.glRenderer.shadowMap.enabled = true;
    graphics3D.glRenderer.shadowMap.type = THREE.PCFShadowMap;
    graphics3D.glRenderer.shadowMapAutoUpdate = true;


    graphics3D.glScene = new THREE.Scene();
    graphics3D.cssScene = new THREE.Scene();

    var ambientLight = new THREE.AmbientLight(0x445555);
    graphics3D.glScene.add(ambientLight);
    var directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(1000, -2, 10).normalize();
    graphics3D.glScene.add(directionalLight);

    graphics3D.controls = new THREE.TrackballControls(graphics3D.camera, graphics3D.cssRenderer.domElement);
    graphics3D.controls.rotateSpeed = 2;
    graphics3D.controls.minDistance = 30;
    graphics3D.controls.maxDistance = 8000;

    visualizationMesh = new THREE.Object3D();
    graphics3D.glScene.add(visualizationMesh);

    update();
}

function draw3DBaseMap() {

    var material = new THREE.MeshBasicMaterial({
        color: 0x000000,
        opacity: 0.0,
        side: THREE.DoubleSide
    });

    var geometry = new THREE.PlaneGeometry(graphics3D.map_length, graphics3D.map_width);
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = 0;
    mesh.position.y = 0;
    mesh.position.z = 0;
    mesh.receiveShadow = true;

    graphics3D.glScene.add(mesh);

    var path = d3.geo.path().projection(graphics3D.projection);

    var g_basemap = graphics3D.svg3DbaseMap.append("g")
        .attr("class", "basemap3D");

    g_basemap.selectAll("path")
        .data(dataIcelandGeo)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", function (d) {
            var name = d.properties.VARNAME_1;
            var index = name.indexOf("|");
            if (index != -1) {
                name = name.substr(0, index);
            }
            return graphics2D.color(name);
        })
        .attr("opacity", 0.4)
        .attr("class", "basemap3Dpath")
        .attr("name", function (d) {
            var name = d.properties.VARNAME_1;
            var index = name.indexOf("|");
            if (index != -1) {
                name = name.substr(0, index);
            }
            return name;
        });

    d3.selectAll(".basemap3Dpath").each(function (d) {
        var center = path.centroid(d);
        var named = d3.select(this).attr("name");
        g_basemap.append("text")
            .attr("class", "basemaplabel3D")
            .text(named)
            .attr("x", center[0])
            .attr("y", center[1]);
        graphics3D.centerMap[named] = center;
    });

    var map_container = document.getElementById("map_container_1");
    var cssObject = new THREE.CSS3DObject(map_container);
    cssObject.position.x = 0, cssObject.position.y = 0, cssObject.position.z = 0;
    cssObject.receiveShadow = true;
    graphics3D.cssScene.add(cssObject);

}

function _draw3DFlows(index) {
    while (visualizationMesh.children.length > 0) {
        var c = visualizationMesh.children[0];
        visualizationMesh.remove(c);
    }
    update();

    var linesGeo = new THREE.Geometry();
    var dreaction = 1;

    var material;

    migrationmatrix.forEach(function (d, i) {
        d.forEach(function (item, j) {

            if ((item > 0) && !(i === j)) {

                if (j > i) {
                    dreaction = -1;
                }
                else {
                    dreaction = 1;
                }

                if (drawingallSwith) {
                    var origin = graphics3D.centerMap[citynameIndexMap[i]],
                        destination = graphics3D.centerMap[citynameIndexMap[j]];
                    material = new THREE.LineBasicMaterial({color: "#007CB5"});

                    var spline = new THREE.CatmullRomCurve3(createCurveArray(destination, origin, dreaction, graphics2D.linerValueScale(item), 100));
                    var geometry = new THREE.Geometry();

                    var numPoints = 100;
                    var splinePoints = spline.getPoints(numPoints);

                    for (var k = 0; k < splinePoints.length; k++) {
                        geometry.vertices.push(splinePoints[k]);
                    }
                    geometry.verticesNeedUpdate = true;
                    linesGeo.merge(geometry);
                }

                if (index != undefined && drawingallSwith || i === index && j !== index) {

                    origin = graphics3D.centerMap[citynameIndexMap[index]];
                    destination = graphics3D.centerMap[citynameIndexMap[j]];

                    var spline = new THREE.CatmullRomCurve3(createCurveArray(origin, destination, dreaction, graphics2D.linerValueScale(item), 200));
                    var geometry = new THREE.Geometry();
                    var numPoints = 100;
                    var splinePoints = spline.getPoints(numPoints);

                    for (var k = 0; k < splinePoints.length; k++) {
                        geometry.vertices.push(splinePoints[k]);
                    }
                    geometry.verticesNeedUpdate = true;
                    linesGeo.merge(geometry);

                }

                else if (index != undefined && drawingallSwith || i !== index && j === index) {

                    origin = graphics3D.centerMap[citynameIndexMap[index]];
                    destination = graphics3D.centerMap[citynameIndexMap[i]];

                    var spline = new THREE.CatmullRomCurve3(createCurveArray(origin, destination, dreaction, graphics2D.linerValueScale(item), 100));
                    var geometry = new THREE.Geometry();
                    var numPoints = 100;
                    var splinePoints = spline.getPoints(numPoints);

                    for (var k = 0; k < splinePoints.length; k++) {
                        geometry.vertices.push(splinePoints[k]);
                    }
                    geometry.verticesNeedUpdate = true;
                    linesGeo.merge(geometry);
                }

            }

        });


    });

    var material = new THREE.LineBasicMaterial({color: "#227CB5"});
    var lines = new THREE.Line(linesGeo, material);
    visualizationMesh.add(lines);
    update();
}

function draw3DFlows(index) {

    lines3DSet.forEach(function (d) {
        d.material.dispose();
        d.geometry.dispose();
        graphics3D.glScene.remove(d);
    });

    migrationmatrix.forEach(function (d, i) {
        d.forEach(function (item, j) {

            if ((item > 0) && !(i === j)) {

                var dreaction = 1;
                if (j > i) {
                    dreaction = -1;
                }
                else {
                    dreaction = 1;
                }

                if (drawingallSwith) {
                    var origin = graphics3D.centerMap[citynameIndexMap[i]],
                        destination = graphics3D.centerMap[citynameIndexMap[j]];

                    var spline = new THREE.CatmullRomCurve3(createCurveArray(origin, destination, dreaction,
                        graphics2D.linerValueScale(item), graphics3D.unitline3D));

                    var material = new THREE.LineBasicMaterial({
                        color: graphics2D.color(citynameIndexMap[i]),
                        linewidth: graphics3D.linerValueScale(item)
                    });

                    var geometry = new THREE.Geometry();
                    var numPoints = 100;
                    var splinePoints = spline.getPoints(numPoints);
                    for (var k = 0; k < splinePoints.length; k++) {
                        geometry.vertices.push(splinePoints[k]);
                    }

                    var line = new THREE.Line(geometry, material);
                    lines3DSet.push(line);
                    graphics3D.glScene.add(line);
                }

                if (index != undefined && drawingallSwith || i === index && j !== index) {

                    origin = graphics3D.centerMap[citynameIndexMap[index]];
                    destination = graphics3D.centerMap[citynameIndexMap[j]];
                    var spline = new THREE.CatmullRomCurve3(createCurveArray(origin, destination, dreaction,
                        graphics2D.linerValueScale(item), graphics3D.unitline3D));
                    var material = new THREE.LineBasicMaterial({
                        color: graphics2D.color(citynameIndexMap[i]),
                        linewidth: graphics3D.linerValueScale(item)
                    });

                    var geometry = new THREE.Geometry();
                    var numPoints = 100;
                    var splinePoints = spline.getPoints(numPoints);
                    for (var k = 0; k < splinePoints.length; k++) {
                        geometry.vertices.push(splinePoints[k]);
                    }
                    var line = new THREE.Line(geometry, material);
                    lines3DSet.push(line);
                    graphics3D.glScene.add(line);

                }

                else if (index != undefined && drawingallSwith || i !== index && j === index) {
                    origin = graphics3D.centerMap[citynameIndexMap[index]];
                    destination = graphics3D.centerMap[citynameIndexMap[i]];

                    var spline = new THREE.CatmullRomCurve3(createCurveArray(origin, destination, dreaction,
                        graphics2D.linerValueScale(item), graphics3D.unitline3D));
                    var material = new THREE.LineBasicMaterial({
                        color: graphics2D.color(citynameIndexMap[i]),
                        linewidth: graphics3D.linerValueScale(item)});

                    var geometry = new THREE.Geometry();
                    var numPoints = 100;
                    var splinePoints = spline.getPoints(numPoints);
                    for (var k = 0; k < splinePoints.length; k++) {
                        geometry.vertices.push(splinePoints[k]);
                    }

                    var line = new THREE.Line(geometry, material);
                    lines3DSet.push(line);
                    graphics3D.glScene.add(line);
                }

            }

        });
    });

    update();
}

function createGlRenderer() {
    var glRenderer = new THREE.WebGLRenderer({alpha: true});
    glRenderer.setClearColor(0x3D3252);
    glRenderer.setPixelRatio(window.devicePixelRatio);
    glRenderer.setSize(graphics3D.windowdiv_width, graphics3D.windowdiv_height);
    glRenderer.domElement.style.position = 'absolute';
    glRenderer.domElement.style.zIndex = 1;
    glRenderer.domElement.style.top = 0;
    return glRenderer;
}

function createCssRenderer() {
    var cssRenderer = new THREE.CSS3DRenderer();
    cssRenderer.setSize(graphics3D.windowdiv_width, graphics3D.windowdiv_height);
    graphics3D.glRenderer.domElement.style.zIndex = 0;
    cssRenderer.domElement.style.top = 0;
    return cssRenderer;
}

function getColor(b) {
    if (b == 1) {
        return 0xc3a130;
    }
    else if (b == -1) {
        return 0x46b39d;
    }
}

function update() {
    graphics3D.controls.update();
    graphics3D.glRenderer.render(graphics3D.glScene, graphics3D.camera);
    graphics3D.cssRenderer.render(graphics3D.cssScene, graphics3D.camera);
    requestAnimationFrame(update);
}

function createCurveArray(point_start, point_end, dreaction, step, unit) {


    var interpoint = new THREE.Vector3((point_start[0] + point_end[0]) / 2 - graphics3D.map_length / 2,
        graphics3D.map_width / 2 - (point_start[1] + point_end[1]) / 2,
        dreaction * step * unit);

    return [new THREE.Vector3(point_start[0] - graphics3D.map_length / 2, graphics3D.map_width / 2 - point_start[1], 0),
        interpoint,
        new THREE.Vector3(point_end[0] - graphics3D.map_length / 2, graphics3D.map_width / 2 - point_end[1], 0)];


}

//-----------------------------3Dmatrix----------------
function draw3Dmatrix() {

    initialize3DM();
    createCushion();
    createVisCubes();

}

function initialize3DM() {

    var width = graphics3D.windowdiv_width_3DM;
    var height = graphics3D.windowdiv_height_3DM;

    graphics3D.camera_3DM = new THREE.PerspectiveCamera(
        50,
        width / height,
        0.1,
        10000);

    graphics3D.camera_3DM.position.set(0, -2000, 3000);

    graphics3D.glRenderer_3DM = createGlRenderer3DM();

    var mapdiv = document.getElementById("migration-3D-matrix");
    mapdiv.appendChild(graphics3D.glRenderer_3DM.domElement);
    //cssRenderer.domElement.appendChild(glRenderer.domElement);
    graphics3D.glRenderer_3DM.shadowMap.enabled = true;
    graphics3D.glRenderer_3DM.shadowMap.type = THREE.PCFShadowMap;
    graphics3D.glRenderer_3DM.shadowMapAutoUpdate = true;


    graphics3D.glScene_3DM = new THREE.Scene();
    //cssScene = new THREE.Scene();

    var ambientLight = new THREE.AmbientLight(0x445555);
    graphics3D.glScene_3DM.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF);
    directionalLight.position.set(3000, 3000, 3000).normalize();
    graphics3D.glScene_3DM.add(directionalLight);

    var directionalLight_2 = new THREE.DirectionalLight(0xFFFFFF);
    directionalLight_2.position.set(3000, -1000, 3000).normalize();
    graphics3D.glScene_3DM.add(directionalLight_2);


    graphics3D.controls_3DM = new THREE.TrackballControls(graphics3D.camera_3DM, graphics3D.glRenderer_3DM.domElement);
    graphics3D.controls_3DM.rotateSpeed = 2;
    graphics3D.controls_3DM.minDistance = 30;
    graphics3D.controls_3DM.maxDistance = 8000;

    createAnewPage();

    update3DM();
}

function createAnewPage(){




}

function createCushion() {
    var material = new THREE.MeshBasicMaterial({
        color: 0x83808C,
        opacity: 0.9,
        side: THREE.DoubleSide
    });

    var geometry = new THREE.PlaneGeometry(graphics3D.map_length_3DM, graphics3D.map_width_3DM);

    var mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    graphics3D.glScene_3DM.add(mesh);
}

function createVisCubes() {
    migrationmatrix.forEach(function (d, i) {
        var row = d;
        row.forEach(function (item, index) {

            var geometry = new THREE.BoxGeometry(90, 90, item);
            var material = new THREE.MeshLambertMaterial({color: 0x358C83});
            geometry.translate(i * 100, index * 100, item / 2);

            geometry.translate(-400, -400, 1);

            var cube = new THREE.Mesh(geometry, material);
            cube.receiveShadow = true;
            graphics3D.glScene_3DM.add(cube);

        });
    });
}

function createGlRenderer3DM() {
    var glRenderer = new THREE.WebGLRenderer({alpha: true});
    glRenderer.setClearColor(0x3D3252);
    glRenderer.setPixelRatio(window.devicePixelRatio);
    glRenderer.setSize(graphics3D.windowdiv_width_3DM, graphics3D.windowdiv_height_3DM);
    //glRenderer.domElement.style.position = 'absolute';
    glRenderer.domElement.style.zIndex = 1;
    glRenderer.domElement.style.top = 0;
    glRenderer.shadowMap.enabled = true;
    glRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    glRenderer.shadowMapAutoUpdate = true;
    return glRenderer;
}

function update3DM() {
    graphics3D.controls_3DM.update();
    graphics3D.glRenderer_3DM.render(graphics3D.glScene_3DM, graphics3D.camera_3DM);
    requestAnimationFrame(update3DM);
}