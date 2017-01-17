(function(){
  var VIZ ={};
  var camera, renderer, controls, scene = new THREE.Scene();
  var width = window.innerWidth, height = window.innerHeight;
  var mapWidth = 700, mapHeight = 400, format = d3.format(".1f");

  camera = new THREE.PerspectiveCamera(40, width/height , 1, 10000);
  camera.position.z = 4500;
  camera.setLens(30);


  //定义函数 function( maps, data from json)
  //绘制地图元素,包括了地图的布局
  VIZ.drawElements = function (mapList, data) {

    VIZ.count = mapList.length;

    //elements 中绑定了数据mapList
    var elements = d3.selectAll('.map-div')
      .data(mapList).enter()
      .append("div")
        .attr("class", "map-div")
        .each(function (d) {

          // 在每一个地图里
          d3.select(this).append("div")
            .attr("class", "map-title")
            .html(function (d) { 
              var text = " - 2010 Incidence Rates by State"
              return d.title + text; 
            });

          d3.select(this).append("div")
            .attr("class", "map-caption")
            .html("2010 CDC Cancer Data");

          d3.select(this).append("div")
            .attr("class", function (d) { 
              return d.elem + " map-rollover"; 
            });

          d3.select(this).append("svg")
            .attr("class", "map-container")
            .attr("width", mapWidth + "px")
            .attr("height", mapHeight + "px")
            .attr("id", function (d) { return d.elem; });

          VIZ.drawMap.call(this, data, d.elem);

        })

    elements.each(setPositionData);
    elements.each(addToScene);


  }


  //在div上绘制地图
  VIZ.drawMap = function (data, elemID) {
    var projection = d3.geo.albersUsa()
        .scale(800)
        .translate([mapWidth - 380, mapHeight - 200]);

    var path = d3.geo.path().projection(projection);

    var scale = d3.scale.quantile()
      .range(["#e4baa2","#d79873","#c97645","#bc5316","#8d3f11"]);


    //应该就是具体的画地图的方法
    var values = data.features.map(function (d) {
     return d.properties.data[elemID].inc;
    });

    scale.domain(d3.extent(values.filter(function (d) {
      return d >= 0;
    })));

    d3.select("#" + elemID).selectAll("path")
      .data(data.features)
     .enter().append("svg:path")
       .attr("d", path)
       .style("fill", function (d) {
        var v = d.properties.data[elemID].inc;
        return v < 0 ? 'grey': scale(v);
       })
       .on("mouseover", function (d) {
         d3.event.preventDefault();
         var state = d.properties.name;
         var irate = d.properties.data[elemID].inc;
         var selector = "." + elemID + ".map-rollover";
         d3.select(selector)
           .html(state + " - " + (irate < 0 ? "No Data": format(irate)));
       })
       .on("mouseout", function (d) {
          d3.event.preventDefault();
          var selector = "." + elemID + ".map-rollover";
          d3.select(selector).html("");
        });

    //绘制图例
    drawLegend(scale, elemID);

  }



  //在场景中添加元素
  var addToScene = function (d) {
    var object = new THREE.CSS3DObject(this);
    object.position = d.random.position;
    object.name = d.elem;
    scene.add(object);

  }

  var setPositionData = function (d, i) {
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

    grid = new THREE.Object3D();
    grid.position.x = (( i % 5 ) * 1050) - 2000;
    grid.position.y = ( - ( Math.floor( i / 5 ) % 5 ) * 650 ) + 800;
    grid.position.z = 0;
    d['grid'] = grid;
  }


  //画图例
  var drawLegend = function (scale, elemID) {
    var grades = [scale.domain()[0]].concat(scale.quantiles());
    var labels = [], from, to;

    for (var i = 0; i < grades.length; i++) {
      from = format(grades[i]);
      to = grades[i + 1] ? format(grades[i + 1]): false;
      labels.push(from + (to ? '-' + to : '+'));
    }

    var svg = d3.select("#" + elemID);

    svg.append('text').text("Quantiles:")
      .attr("transform", "translate(625, 190)");


    var legend = svg.selectAll(".legend")
        .data(grades)
      .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function (d, i) { 
          return "translate(0," + ((i * 20) + 200) + ")";
        });

    legend.append("rect")
        .attr("x", mapWidth - 10)
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", function (d, i) { return scale(grades[i]); })
        .style("stroke", "grey");

    legend.append("text")
        .attr("x", mapWidth - 12)
        .attr("y", 5)
        .attr("dy", ".30em")
        .style("text-anchor", "end")
        .text(function (d, i) { return labels[i]; });
  }


  //add by Yuhang. 计算并添加数据流
  VIZ.drawLinks = function(){

    var geometry = new THREE.Geometry();
    var material = new THREE.LineBasicMaterial( { vertexColors: THREE.VertexColors} );
    var color1 = new THREE.Color( 0x444444 ), color2 = new THREE.Color( 0xFF0000 );
    var p1 = new THREE.Vector3( 0, 0, 0 );
    var p2 = new THREE.Vector3(  1000000, 1000000, 1000000 );
    geometry.vertices.push(p1);
    geometry.vertices.push(p2);
    geometry.colors.push( color1, color2 );
    var line = new THREE.Line( geometry, material, THREE.LinePieces);
    line.linewidth = 2000;
    line.color = (255,0,255);
    scene.add(line);

  }



  //three 渲染函数
  VIZ.render = function () {
    console.log(scene);
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

  //创建渲染器 renderer
  renderer = new THREE.CSS3DRenderer();
  renderer.setSize(width, height);
  renderer.domElement.style.position = 'absolute';
  document.getElementById('container').appendChild(renderer.domElement);


  controls = new THREE.TrackballControls(camera, renderer.domElement);
  controls.rotateSpeed = 0.5;
  controls.minDistance = 100;
  controls.maxDistance = 6000;
  controls.addEventListener('change', VIZ.render);
 // console.log(controls);

  VIZ.resetControls = controls.reset;

  VIZ.onWindowResize = function () {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    VIZ.render();
  }
  window.VIZ = VIZ;
}())