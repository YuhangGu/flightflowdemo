//????
	function drawAxisTime(filename, svg, w, h, data) {
		
		//var data = ["1995", "1996", "1997"];
		var padding = 60;
		var axisw  = w - 2*padding;
		var axish = h;
		
		var svgTimeAxis = svg.append("g")//?body?????svg
			    .attr("class", "axis") // ??"axis" ?;
					
		//????<line x1="0" y1="0" x2="500" y2="50" stroke="black"/>
		svgTimeAxis.append("line")
				   .attr("x1", padding)
				   .attr("y1", axish)
				   .attr("x2", axisw+padding)
				   .attr("y2", axish)
				   .attr("stroke", "black");

		//?????????
		var length = data.length;
		//???????
		var xScale = d3.scale.linear()
				.domain([0, length-1])
				.range([padding, axisw+padding]);

		var r = 5;

		//???
		var circles = svgTimeAxis.selectAll("circle")
			.data(data)
			.enter()
			.append("circle")
			.attr("class", "circle")
			.attr("id", function(d){
				return d;
			})
			.style("fill", function(d, i) {
				return "#63B8FF";
			});

			circles.attr("cx", function(d, i) {
				return xScale(i);
			})
			.on("click", function(d){
				//var year = this.id;
				circlemouseover(filename, provinceId, coutiesId, d, this);	
			})
			.attr("cy", axish)
			.attr("r", r);

		//???? <text x="250" y="25">Easy-peasy</text>
		var texts = svgTimeAxis.selectAll("text")
			.data(data)
			.enter()
			.append("text")
			.text(function(d, i){
				return d;
			})
			.attr("x", function(d, i) {
				return xScale(i);
			})
			.attr("y", axish+30)
			.attr("text-anchor", "middle");//????
	}

	//?????????
	function circlemouseover(filename, provinceId, coutiesId, year, t){

		globalyear = year;

		//???????????????
		d3.selectAll(".circle")
		  .attr("r", 5)
		  .style("fill", "#63B8FF")
		//??????????????
		if(t != undefined) {
			var circle = d3.select(t);
			circle.transition()
	  			.duration(750)
	  			.attr("r", function(d){  //??????                      
						return 5+5;                          
					}).style("fill", "#C0FF3E");
	  	}
  		
  		//var jsonpath = "json/" +this.id + ".json";
  		var jsonpath = "json/data/" + filename + "/" + year + ".json";

  		//?????????
  		d3.json(jsonpath, function(error, yeardata){
  			
				if (error)  
					return console.error(error);
				if(yeardata == undefined){
					return ;
					}
  			
			//d3.selectAll("#pie").transition().duration(350).remove();//?????pie
			d3.selectAll("#pie").remove();
			
			d3.selectAll(".province_name").remove();//???????
			d3.selectAll(".city_name").remove();//???????
			d3.selectAll(".county_name").remove();//???????
			//?????
	  		var scale = d3.scale.linear()
			.domain([yeardata.min, yeardata.max])
			.range([15, 35])
			.nice();
			
			
			
			provinceDataYear=yeardata;  //?????????,??????
			
			var provinceMax=yeardata.max;
			var provinceMin=yeardata.min;
			var provinceData = [];
			var provinceDataKey = [12, 13, 14, 15, 21, 22, 23, 31, 32, 33, 34, 35, 36, 37, 41, 42, 43, 44, 45, 46, 51, 52, 53, 54, 61, 62, 63, 64, 65];
			for(var i=0; i<provinceDataKey.length; i++) {
				provinceData.push(yeardata[provinceDataKey[i]].sum);
			}
			drawRangeFinal(provinceMax, provinceMin, provinceData);   //??????
			
			//???????????
			nodes.forEach(function(d){
				var name = yeardata[d.id];
				if(name != undefined) {
					setTimeout(function(){
						pie(svg, name, scale(name.sum), d, year);
						//??????
						svg.append("text").attr("class","province_name")
							.attr("dx",d.x).attr("dy",d.y-scale(name.sum)/2).attr("text-anchor","middle")
							.attr("fill",textColor).attr("font-size","12px").attr("fill-opacity",0.0)
							.text(d.name);
					});
				}
			});
		});
		//?????????
		//provinceFileName
		if(provinceId != null) {
			var jsonpath = "json/data/" + provinceId + "_" + year + ".json";
			d3.json(jsonpath, function(error, yeardata){
				//?????
				
					if(yeardata == undefined){
					return ;
					}
					
		  	var scale = d3.scale.linear()
				.domain([yeardata.min, yeardata.max])
				.range([15, 35])
				.nice();
				
				provinceNodes.forEach(function(d){
					var name = yeardata[d.id];
					if(name != undefined) {
						setTimeout(function(){
							pie(svg, name, scale(name.sum), d, year);
							//?????
							svg.append("text").attr("class","city_name")
								.attr("dx",d.x).attr("dy",d.y-scale(name.sum)/2).attr("text-anchor","middle")
								.attr("fill",textColor).attr("fill-opacity",0.0).attr("font-size","12px")
								.text(d.name);
						});
					}
				});
			});
		}
		//?????????
		if(coutiesId != null) {
			var jsonpath = "json/data/" + coutiesId + "00_" + year + ".json";

			d3.json(jsonpath, function(error, yeardata){
				if(yeardata == undefined){
					return ;
					}
			
				//?????
		  		var scale = d3.scale.linear()
				.domain([yeardata.min, yeardata.max])
				.range([15, 35])
				.nice();
				
				coutiesNodes.forEach(function(d){
					var name = yeardata[d.id];
					if(name != undefined) {
						setTimeout(function(){
							pie(svg, name, scale(name.sum), d, year);
							//?????
							svg.append("text").attr("class","county_name")
								.attr("dx",d.x).attr("dy",d.y-scale(name.sum)/2).attr("text-anchor","middle")
								.attr("fill",textColor).attr("fill-opacity",0.0).attr("font-size","12px")
								.text(d.name);
						});
					}
				});
			});
		}
		
		
	
	}