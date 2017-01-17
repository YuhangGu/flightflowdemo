(function(){
  var VIZ ={};
  var camera, renderer, controls, scene = new THREE.Scene();
  var width = window.innerWidth, height = window.innerHeight;
  var mapWidth = 700, mapHeight = 400, format = d3.format(".1f");

  camera = new THREE.PerspectiveCamera(40, width/height , 1, 10000);
  camera.position.z = 4500;
  camera.setLens(24);

  VIZ.drawElements = function (mapList, data) {
    VIZ.count = mapList.length;

    var elements = d3.selectAll('.map-div')
      .data(mapList).enter()
      .append("div")
        .attr("class", "map-div")
        .each(function (d) {

          //为每一个地图添加内容
          d3.select(this).append("div")
            .attr("class", "map-container")
            .style("width", mapWidth + "px")
            .style("height", mapHeight + "px")
            .attr("id", function (d) { return d.elem; });
          VIZ.drawMap(data, d.elem, d.style);
        });

    elements.each(setData);
    elements.each(addToScene);

    // MOVE ZOOM CONTROLS IN FRONT OF MAP
    d3.selectAll(".leaflet-top.leaflet-left")
      .style("transform", "translate3d(0px, 0px, 5px)")
      .style("-webkit-transform", "translate3d(0px, 0px, 5px)")

    // MOVE LEGENDS IN FRONT OF MAP
    d3.selectAll(".map-legend")
      .style("transform", "translate3d(0px, 0px, 5px)")
      .style("-webkit-transform", "translate3d(0px, 0px, 5px)")

  }

  //绘制地图
  VIZ.drawMap = function (data, elemID, _style) {

    var scale = d3.scale.quantile()
      .range(["#e4baa2","#d79873","#c97645","#bc5316","#8d3f11"]);


    // Provide your access token
    //L.mapbox.accessToken = 'pk.eyJ1IjoiaXRjYWVybyIsImEiOiJjaWxuZmtlOHQwMDA2dnNseWMybHhvMXh0In0.DObc4iUf1_86LxJGF0RHog';
    // Create a map in the div #map
    //var map = L.mapbox.map('map', 'mapbox.streets').setView([34.7439398,113.6657126], 11);

    L.mapbox.accessToken = 'pk.eyJ1IjoiaXRjYWVybyIsImEiOiJjaWxuZmtlOHQwMDA2dnNseWMybHhvMXh0In0.DObc4iUf1_86LxJGF0RHog';
    var map = L.mapbox.map(elemID, _style).setView([34.743945,113.668], 13);
      console.log(_style);

    //var map = L.mapbox.map(elemID).setView([34.7439398,113.6657126], 11);

    //var tileLayer = L.mapbox.tileLayer('delimited.ge9h4ffl', {noWrap: false}).addTo(map);

    //map.touchZoom.disable();
    //map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();

    /*
    var geoLayer = L.geoJson(data, {
      style: getStyleFun(scale, elemID),
      onEachFeature: onEachFeature
    }).addTo(map);
    */
    
    //map.legendControl.addLegend(getLegendHTML(scale));
  }

  var getLegendHTML = function (scale) {
    var grades = [scale.domain()[0]].concat(scale.quantiles());
    var labels = [], from, to;

    for (var i = 0; i < grades.length; i++) {
      from = d3.format(".2f")(grades[i]);
      to = grades[i + 1] ? d3.format(".2f")(grades[i + 1]): false;

      labels.push(
        '<li><span class="swatch" style="background:' + 
        scale(grades[i]) + '"></span> ' +
        from + (to ? '&ndash;' + to : '+') + '</li>');
    }
    return '<span>Quantiles:</span><ul>' + labels.join('') + '</ul>';
  }

  var getStyleFun = function (scale, elemID) {
    return function (feature) {
      var d = feature.properties.data[elemID].inc;
      return {
        fillColor: d < 0 ? '#222': scale(d),
        weight: 1,
        opacity: 1,
        color: 'grey',
        dashArray: '3',
        fillOpacity: 0.6
      };
    }
  }

  var addToScene = function (d) {
    var object = new THREE.CSS3DObject(this);
    object.position = d.random.position;
    object.name = d.elem;
    scene.add(object);
  }

  var setData = function (d, i) {
    var vector, phi, theta;
    var random, sphere, grid;

    random = new THREE.Object3D();
    random.position.x = Math.random() * 4000 - 2000;
    random.position.y = Math.random() * 4000 - 2000;
    random.position.z = Math.random() * 4000 - 2000;
    d['random'] = random;

    sphere = new THREE.Object3D();
    phi = Math.acos( -1 + ( 2 * i ) / VIZ.count );
    theta = Math.sqrt( VIZ.count * Math.PI ) * phi;
    vector = new THREE.Vector3();
    sphere.position.x = 1200 * Math.cos( theta ) * Math.sin( phi );
    sphere.position.y = 1200 * Math.sin( theta ) * Math.sin( phi );
    sphere.position.z = 1200 * Math.cos( phi );
    vector.copy( sphere.position ).multiplyScalar( 2 );
    sphere.lookAt( vector );
    d['sphere'] = sphere;

    var helix = new THREE.Object3D();
    vector = new THREE.Vector3();
    phi = (i + 12) * 0.7 + Math.PI;
    helix.position.x = 1000 * Math.sin(phi);
    helix.position.y = - (i * 50) + 500;
    helix.position.z = 1000 * Math.cos(phi);
    vector.x = helix.position.x * 2;
    vector.y = helix.position.y;
    vector.z = helix.position.z * 2;
    helix.lookAt(vector);
    d['helix'] = helix;


    grid = new THREE.Object3D();
    grid.position.x = (( i % 5 ) * 1050) - 2000;
    grid.position.y = ( - ( Math.floor( i / 5 ) % 5 ) * 650 ) + 800;
    grid.position.z = 0;
    d['grid'] = grid;
  }

  var onEachFeature = function (feature, layer) {
    layer.on({
        mouseover: mouseover,
        mouseout: mouseout
    });
  }

  var mouseover = function (e) {
    var layer = e.target;
    var attrs = layer._map._container.__data__;
    var state = e.target.feature.properties.name;
    var irate = e.target.feature.properties.data[attrs.elem].inc;
    var selector = "." + attrs.elem + ".map-rollover";

    d3.select(selector)
      .html(state + " - " + (irate < 0 ? "No Data": format(irate)));

    layer.setStyle({
        weight: 2,
        color: 'tomato',
        dashArray: '',
        fillOpacity: 0.6
    });
    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }
  }

  var mouseout = function (e) {
    var layer = e.target;
    var attrs = layer._map._container.__data__;
    var selector = "." + attrs.elem + ".map-rollover";
    d3.select(selector).html("");
    layer.setStyle({
        weight: 1,
        opacity: 1,
        color: 'grey',
        dashArray: '3',
        fillOpacity: 0.6
    });
    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }
  }

  VIZ.render = function () {
    renderer.render(scene, camera);
  }

  VIZ.transform = function (layout) {
    var duration = 1000;

    TWEEN.removeAll();

    scene.children.forEach(function (object){
      var newPos = object.element.__data__[layout].position;
      var coords = new TWEEN.Tween(object.position)
            .to({x: newPos.x, y: newPos.y, z: newPos.z}, duration)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .start();

      var newRot = object.element.__data__[layout].rotation;
      var rotate = new TWEEN.Tween(object.rotation)
            .to({x: newRot.x, y: newRot.y, z: newRot.z}, duration)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .start();
    });
    
   var update = new TWEEN.Tween(this)
       .to({}, duration)
       .onUpdate(VIZ.render)
       .start();
  }

  VIZ.animate = function () {
    requestAnimationFrame(VIZ.animate);
    TWEEN.update();
    controls.update();
  }

  renderer = new THREE.CSS3DRenderer();
  renderer.setSize(width, height);
  renderer.domElement.style.position = 'absolute';
  document.getElementById('container').appendChild(renderer.domElement);

  controls = new THREE.TrackballControls(camera, renderer.domElement);
  controls.rotateSpeed = 0.5;
  controls.minDistance = 100;
  controls.maxDistance = 6000;
  controls.addEventListener('change', VIZ.render);

  VIZ.resetControls = controls.reset;

  VIZ.onWindowResize = function () {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    VIZ.render();
  }
  window.VIZ = VIZ;
}())