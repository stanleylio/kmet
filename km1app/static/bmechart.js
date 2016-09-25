$(function() {
	var window_size = 1000;	// max sample count
	var preload = 3600;		// seconds
	
	var fields = ['T','P','RH'];
	
	var chart;

	function conv(s) {
		return [
			1000*s[0],
			s[1],
			s[2],
			s[3],
		];
	}
	
	function addpoint(d) {
		if (!(chart == null)) {
			var d = conv([d['ts'],d[fields[0]],d[fields[1]],d[fields[2]]]);

			var shifts = _.map(chart.series,function(v,i,c) {
				return v.data.length > window_size;
			});
			var shift = _.reduce(shifts,function(acc,val) {
				return acc || val;
			});

			chart.series[0].addPoint([d[0],d[1]],true,shift);
			chart.series[1].addPoint([d[0],d[2]],true,shift);
			chart.series[2].addPoint([d[0],d[3]],true,shift);
		}
	}

	var t_color = Highcharts.getOptions().colors[2];
	var p_color = Highcharts.getOptions().colors[0];
	var rh_color = Highcharts.getOptions().colors[3];

	chart = new Highcharts.Chart({
		chart: {
			type: 'line',
			renderTo: 'container',
			defaultSeriesType: 'spline',
			events: {
				//load: addpoint
			},
			animation: false
		},
		title: {
			text: 'Temperature, Barometric Pressure and Relative Humidity'
		},
		/*subtitle: {
			text: 'Live data from a Bosch BME280 in the electrical box on the met. mast'
			style: {
				fontSize: '1.5em'
			}
		},*/
		xAxis: {
			type: 'datetime',
			tickPixelInterval: 150,
			minRange: 1000,
			title: {
				text: 'UTC',
				style: {
					fontSize: '2em',
				}
			}
		},
		yAxis: [{
			minPadding: 0.2,
			maxPadding: 0.2,
			labels: {
				format: '{value}°C',
				style: {
					color: t_color
					
				}
			},
			title: {
				text: 'Temperature',
				margin: 30,
				style: {
					fontSize: '2em',
					color: t_color
				}
			}
		},{
			gridLineWidth: 0,
			labels: {
				format: '{value}kPa',
				style: {
					color: p_color
				}
			},
			title: {
				text: 'Barometric Pressure',
				style: {
					fontSize: '2em',
					color: p_color
				}
			},
			opposite: true
		},{
			gridLineWidth: 0,
			labels: {
				format: '{value}%',
				style: {
					color: rh_color
				}
			},
			title: {
				text: 'Relative Humidity',
				style: {
					fontSize: '2em',
					color: rh_color
				}
			},
			opposite: true
		}],
		tooltip: {
			shared: true
		},
		series: [{
			name: 'Temperature',
			data: [],
			yAxis: 0,
			color: t_color,
			lineWidth: 3,
			tooltip: {
				valueSuffix: ' °C'
			}
		},{
			name: 'Barometric Pressure',
			data: [],
			yAxis: 1,
			color: p_color,
			lineWidth: 3,
			dashStyle: 'shortdash',
			tooltip: {
				valueSuffix: ' kPa'
			}
		},{
			name: 'Relative Humidity',
			data: [],
			yAxis: 2,
			color: rh_color,
			lineWidth: 3,
			dashStyle: 'shortdot',
			tooltip: {
				valueSuffix: ' %'
			}
		}],
		tooltip: {
			enabled: true
		},
		legend: {
			enabled: true,
			layout: 'vertical',
			floating: true,
			align: 'left',
			verticalAlign: 'top',
			y: 60,
			x: 100,
			backgroundColor: '#ffffff',
			itemStyle: {
				fontSize: '1em'
			}
		},
		/*exporting: {
			sourceWidth: 1600,
			sourceHeight: 800,
		},*/
		credits: {
			enabled: false
		},
		/*plotOptions: {
			area: {
				fillColor: {
					linearGradient: {
						x1:0,
						y1:0,
						x2:0,
						y2:1
					},
					stops: [
						[0, Highcharts.getOptions().colors[2]],
						[1, Highcharts.Color(Highcharts.getOptions().colors[2]).setOpacity(0).get('rgba')]
					]
				}
			}
		},*/
	});
	
	// preload historical data (past one hour)
	var begin = Date.now()/1000 - preload;
	var url = '/data/1/BME280.json?begin=' + begin;
	//console.log(url);
	$.getJSON(url,function(data) {
		if (!(chart == null)) {
			// sort by timestamp (Highcharts requires this)
			var tmp = _.zip(data['ts'],data[fields[0]],data[fields[1]],data[fields[2]]);
			tmp = tmp.sort(function(a,b) { return a[0] > b[0]; });

			// apply any necessary unit conversion and transformation
			tmp = _.map(tmp,function(v,i,c) {
				return conv(v);
			});
			
			// populate plot with data
			chart.series[0].setData(_.map(tmp,function(v,i,c) { return [v[0],v[1]]; }),false,false);
			chart.series[1].setData(_.map(tmp,function(v,i,c) { return [v[0],v[2]]; }),false,false);
			chart.series[2].setData(_.map(tmp,function(v,i,c) { return [v[0],v[3]]; }),false,false);
			chart.redraw();
		}
	});
	
	//var url = "ws://localhost:9000/";
	var url = "ws://" + String(window.location.host) + ":9000";
	//ws = new WebSocket(url);
	ws = new ReconnectingWebSocket(url);
	ws.onopen = function(evt) {
		//console.log(evt)
	};
	ws.onclose = function(evt) {
		//console.log("closed")
	};
	ws.onmessage = function(evt) {
		//console.log(evt.data);
		var m = evt.data;
		var i = m.indexOf(',');
		if (m.substr(0,i).includes("_BME280")) {
			var data = JSON.parse(m.substr(i+1));
			addpoint(data);
			check_liveliness(chart,120);
		}
	};
	ws.onerror = function(evt) {
		console.log("error?")
	};

	setInterval(function() { check_liveliness(chart,120); },10*1000);
});