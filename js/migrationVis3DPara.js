/**
 * Created by Aero on 14/03/2017.
 */
/**
 * Created by Aero on 23/02/2017.
 */
var graphics3DPara = {
    //doc div parameters
    divID           : "migration-Sankey-3D",
    windowdiv_width : $("#migration-Sankey-3D").width(),
    windowdiv_height : 600,
    //graphic elements
    svg3DbaseMap1 : null,
    svg3DbaseMap2 : null,
    projection : null,

    //3D sence
    camera      : null,
    glScene     : null,
    cssScene    : null,
    glRenderer  : null,
    cssRenderer : null,
    controls    : null,

    distance    : 1000,

    //3D for matrix
    camera_3DM : null,
    glScene_3DM : null,
    cssScene_3DM : null,
    glRenderer_3DM: null,
    controls_3DM: null,

    //2D graphic
    map_length : 2800,
    map_width  : 2400,
    map_height : 2400,

    map_length_3DM : 1600,
    map_width_3DM : 1600,

    //other
    centerMap : d3.map()
}

function draw3DSankeyMap(){
    initializeSankeyMap();
    draw3DBaseMapSankey();
    draw3DSankeyFlows();
}

function initializeSankeyMap() {

    d3.selectAll('.migration_map_div_sankey')
        .data([1,2]).enter()
        .append("div")
        .attr("class", "migration_map_div_sankey")
        .attr("id",function(d){
            return "map_sankey_" + d;
        });

    graphics3DPara.svg3DbaseMap1 = d3.select("#map_sankey_1").append("svg")
        .attr("id","svg_flow_3D_2")
        .attr("width", graphics3DPara.map_length)
        .attr("height", graphics3DPara.map_width)
        .attr("transform", "rotate(0,180,180)")
        .attr("transform", "translate(" + graphics3DPara.map_width/2 +"," + graphics3DPara.map_height/2 + ")");
    graphics3DPara.svg3DbaseMap2 = d3.select("#map_sankey_2").append("svg")
        .attr("id","svg_flow_3D_2")
        .attr("width", graphics3DPara.map_length)
        .attr("height", graphics3DPara.map_width)
        .attr("transform", "rotate(0,180,180)")
        .attr("transform", "translate(" + graphics3DPara.map_width/2 +"," + graphics3DPara.map_height/2 + ")");

    graphics3DPara.projection = d3.geo.stereographic()
        .scale(40000)
        .center(graphics2D.icelandCenter)
        .translate([graphics3DPara.map_length/2, graphics3DPara.map_width / 2])
        .rotate([0, 0])
        .clipAngle(180 - 1e-4)
        .clipExtent([[0, 0], [graphics3DPara.map_width, graphics3DPara.map_height]])
        .precision(.1);

    graphics3DPara.camera = new THREE.PerspectiveCamera(
        50,
        graphics3DPara.windowdiv_width / graphics3DPara.windowdiv_height,
        0.1,
        10000);

    graphics3DPara.camera.position.set(4000, 0, 0)

    //reate two renders
    graphics3DPara.glRenderer = createGlRendererSankey();
    graphics3DPara.cssRenderer = createCssRendererSankey();


    var mapdiv = document.getElementById(graphics3DPara.divID);
    mapdiv.appendChild(graphics3DPara.cssRenderer.domElement);
    graphics3DPara.cssRenderer.domElement.appendChild(graphics3DPara.glRenderer.domElement);
    graphics3DPara.glRenderer.shadowMap.enabled = true;
    graphics3DPara.glRenderer.shadowMap.type = THREE.PCFShadowMap;
    graphics3DPara. glRenderer.shadowMapAutoUpdate = true;


    graphics3DPara.glScene = new THREE.Scene();
    graphics3DPara.cssScene = new THREE.Scene();

    var ambientLight = new THREE.AmbientLight(0x445555);
    graphics3DPara.glScene.add(ambientLight);
    var directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set( 1000, -2, 10 ).normalize();
    graphics3DPara.glScene.add(directionalLight);

    graphics3DPara.controls = new THREE.TrackballControls(graphics3DPara.camera,graphics3DPara.cssRenderer.domElement);
    graphics3DPara.controls.rotateSpeed = 2;
    graphics3DPara.controls.minDistance = 30;
    graphics3DPara.controls.maxDistance = 8000;

    updateSankey();
}

function draw3DBaseMapSankey(){

    var material = new THREE.MeshBasicMaterial({
        color: 0x000000,
        opacity: 0.0,
        side: THREE.DoubleSide
    });

    var geometry1 = new THREE.PlaneGeometry(graphics3DPara.map_length, graphics3DPara.map_width);
    var mesh1 = new THREE.Mesh(geometry1, material);
    mesh1.position.x = 0;
    mesh1.position.y = 0;
    mesh1.position.z = graphics3DPara.distance;
    mesh1.receiveShadow	= true;

    var geometry2 = new THREE.PlaneGeometry(graphics3DPara.map_length, graphics3DPara.map_width);
    var mesh2 = new THREE.Mesh(geometry2, material);
    mesh2.position.x = 0;
    mesh2.position.y = 0;
    mesh2.position.z = -1 * graphics3DPara.distance;
    mesh2.receiveShadow	= true;

    graphics3DPara.glScene.add(mesh1);
    graphics3DPara.glScene.add(mesh2);

    var path = d3.geo.path().projection(graphics3DPara.projection);

    var g_basemap1 = graphics3DPara.svg3DbaseMap1.append("g")
        .attr("class","basemap3D");

    var g_basemap2 = graphics3DPara.svg3DbaseMap2.append("g")
        .attr("class","basemap3D");

    g_basemap1.selectAll("path")
        .data(dataIcelandGeo)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", function (d) {
            var name = d.properties.VARNAME_1;
            var index = name.indexOf("|");
            if(index != -1){name = name.substr(0,index);}
            return graphics2D.color(name);
        })
        .attr("opacity", 0.4)
        .attr("class","basemap3Dpath")
        .attr("name", function (d) {
            var name = d.properties.VARNAME_1;
            var index = name.indexOf("|");
            if (index != -1) {
                name = name.substr(0, index);
            }
            return name;
        })
        .on("mouseover", function (d){
            d3.event.preventDefault();
            console.log("hehe");
            selectedCity = d3.select(this).attr("name");
            console.log("selectedCity: ",selectedCity);
            if(lastSelectedCity != selectedCity){

                console.log("lastSelectedCity: ",lastSelectedCity);
                lastSelectedCity = selectedCity;
                updateVisualizations(selectedCity);
            }
        });

    g_basemap2.selectAll("path")
        .data(dataIcelandGeo)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", function (d) {
            var name = d.properties.VARNAME_1;
            var index = name.indexOf("|");
            if(index != -1){name = name.substr(0,index);}
            return graphics2D.color(name);
        })
        .attr("opacity", 0.4)
        .attr("class","basemap3Dpath")
        .attr("name", function (d) {
            var name = d.properties.VARNAME_1;
            var index = name.indexOf("|");
            if (index != -1) {
                name = name.substr(0, index);
            }
            return name;
        })
        .on("mouseover", function (d){
            d3.event.preventDefault();
            console.log("hehe");
            selectedCity = d3.select(this).attr("name");
            console.log("selectedCity: ",selectedCity);
            if(lastSelectedCity != selectedCity){

                console.log("lastSelectedCity: ",lastSelectedCity);
                lastSelectedCity = selectedCity;
                updateVisualizations(selectedCity);
            }
        });

    d3.selectAll(".basemap3Dpath").each(function (d) {
        var center = path.centroid(d);
        var named = d3.select(this).attr("name");
        g_basemap1.append("text")
            .attr("class", "basemaplabel3D")
            .text(named)
            .attr("x", center[0])
            .attr("y", center[1]);
        g_basemap2.append("text")
            .attr("class", "basemaplabel3D")
            .text(named)
            .attr("x", center[0])
            .attr("y", center[1]);
        graphics3DPara.centerMap[named] = center;
    });

    var map_container1 = document.getElementById("map_sankey_1");
    var cssObject1 = new THREE.CSS3DObject(map_container1);
    cssObject1.position.x = 0, cssObject1.position.y = 0, cssObject1.position.z = graphics3DPara.distance;
    cssObject1.receiveShadow	= true;
    graphics3DPara.cssScene.add(cssObject1);

    var map_container2 = document.getElementById("map_sankey_2");
    var cssObject2 = new THREE.CSS3DObject(map_container2);
    cssObject2.position.x = 0, cssObject2.position.y = 0, cssObject2.position.z = -1 * graphics3DPara.distance;
    cssObject2.receiveShadow	= true;
    graphics3DPara.cssScene.add(cssObject2);

}

function draw3DSankeyFlows(index) {

    //clear the canvas
    linesPara3DSet.forEach(function (d) {
        d.material.dispose();
        d.geometry.dispose();
        graphics3DPara.glScene.remove(d);
    });

    migrationmatrix.forEach(function(d,i){
        d.forEach(function(item, j){

            if ((item > 0) && !(i === j)){

                if (drawingallSwith) {
                    var origin = graphics3D.centerMap[citynameIndexMap[i]],
                        destination = graphics3D.centerMap[citynameIndexMap[j]];

                    var spline = new THREE.CatmullRomCurve3(createCurveArraySankey(origin, destination, graphics3DPara.distance));

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
                    linesPara3DSet.push(line);
                    graphics3DPara.glScene.add(line);
                }


                if (index != undefined && drawingallSwith || i === index && j !== index) {

                    origin = graphics3D.centerMap[citynameIndexMap[index]];
                    destination = graphics3D.centerMap[citynameIndexMap[j]];
                    var spline = new THREE.CatmullRomCurve3(createCurveArraySankey(origin, destination, graphics3DPara.distance));
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
                    linesPara3DSet.push(line);
                    graphics3DPara.glScene.add(line);

                }

                else if (index != undefined && drawingallSwith || i !== index && j === index) {
                    origin = graphics3D.centerMap[citynameIndexMap[i]];
                    destination  = graphics3D.centerMap[citynameIndexMap[index]];


                    var spline = new THREE.CatmullRomCurve3(createCurveArraySankey(origin, destination, graphics3DPara.distance));
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
                    linesPara3DSet.push(line);
                    graphics3DPara.glScene.add(line);
                }

            }

        });

    });

}

function createGlRendererSankey() {
    var glRenderer = new THREE.WebGLRenderer({alpha:true});
    glRenderer.setClearColor(0x3D3252);
    glRenderer.setPixelRatio(window.devicePixelRatio);
    glRenderer.setSize(graphics3DPara.windowdiv_width, graphics3DPara.windowdiv_height);
    glRenderer.domElement.style.position = 'absolute';
    glRenderer.domElement.style.zIndex = 1;
    glRenderer.domElement.style.top = 0;
    return glRenderer;
}

function createCssRendererSankey() {
    var cssRenderer = new THREE.CSS3DRenderer();
    cssRenderer.setSize(graphics3DPara.windowdiv_width, graphics3DPara.windowdiv_height);
    graphics3DPara.glRenderer.domElement.style.zIndex = 0;
    cssRenderer.domElement.style.top = 0;
    return cssRenderer;
}

function getColorSankey(b){
    if (b == 1){
        return 0xc3a130;
    }
    else if(b == -1)
    {
        return 0x46b39d;
    }
}

function updateSankey() {
    graphics3DPara.controls.update();
    graphics3DPara.cssRenderer.render(graphics3DPara.cssScene, graphics3DPara.camera);
    graphics3DPara.glRenderer.render(graphics3DPara.glScene, graphics3DPara.camera);
    requestAnimationFrame(updateSankey);
}

function createCurveArraySankey(point_start, point_end , distance){
    var interpoint =  new THREE.Vector3( (point_start[0]+point_end[0])/2 - graphics3DPara.map_length/2,
        graphics3DPara.map_width/2 - (point_start[1]+point_end[1])/2 , 0);

    return [new THREE.Vector3(point_start[0] - graphics3DPara.map_length/2 ,graphics3DPara.map_width/2 - point_start[1] ,-1 * distance),
        interpoint,
        new THREE.Vector3( point_end[0] - graphics3DPara.map_length/2, graphics3DPara.map_width/2 - point_end[1] , distance) ];

}