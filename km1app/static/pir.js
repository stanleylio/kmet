$(function() {
	var chart;

	function r2t(R) {
		var C1 = 0.0010295;
		var C2 = 0.0002391;
		var C3 = 0.0000001568;
		return 1/(C1 + C2*Math.log(R) + C3*(Math.pow(Math.log(R),3))) - 273.15;
	}
	function v2r(V) {
		var Vref = 2.5;
		if (Vref <= V) {
			return NaN;
		}
		return 10e3*V/(Vref-V);
	}
	
	function addpoint(d) {
		if (!(chart == null)) {
			var window_size = 3600;
			var ts = d['ts']*1000;
			var ir_mV = d['ir_mV'];
			var t_case_V = d['t_case_V'];
			var t_dome_V = d['t_dome_V'];
			var series = chart.series[0];
			var shift = series.data.length > window_size;
			chart.series[0].addPoint([ts,ir_mV],true,shift);
			chart.series[1].addPoint([ts,r2t(v2r(t_case_V))],true,shift);
			chart.series[2].addPoint([ts,r2t(v2r(t_dome_V))],true,shift);
		}
	}

	function check_liveliness() {
		if (is_fresh(chart,120)) {
			//console.log('fresh');
			$('body').css("-webkit-filter","");
			$('body').css("filter","");
		} else {
			//console.log('stale');
			$('body').css("-webkit-filter","grayscale(100%)");
			$('body').css("filter","grayscale(100%)");
		}
	}

	//var color1 = Highcharts.getOptions().colors[2];
	var color1 = 'red';
	//var color2 = Highcharts.getOptions().colors[0];
	var color2 = 'orange';
	//var color3 = Highcharts.getOptions().colors[3];
	var color3 = 'gold';

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
			text: 'Longwave Irradiance (IR)'
		},
		/*subtitle: {
			text: 'Data from a Precision Infrared Radiometer (Pyrgeometer, PIR)',
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
				format: '{value}',
				style: {
					color: color1,
					fontSize: '1.5em',
				}
			},
			title: {
				text: 'Irradiance (W/m^2) (CALIBRATION FACTOR?)',
				margin: 30,
				style: {
					fontSize: '2em',
					color: color1
				}
			}
		},{
			gridLineWidth: 0,
			labels: {
				format: '{value}°C',
				style: {
					color: color2,
					fontSize: '1.5em',
				}
			},
			title: {
				text: 'Case Temperature',
				style: {
					fontSize: '2em',
					color: color2
				}
			},
			opposite: true
		},{
			gridLineWidth: 0,
			labels: {
				format: '{value}°C',
				style: {
					color: color3,
					fontSize: '1.5em',
				}
			},
			title: {
				text: 'Dome Temperature',
				style: {
					fontSize: '2em',
					color: color3
				}
			},
			opposite: true
		}],
		tooltip: {
			shared: true
		},
		series: [{
			name: 'IR',
			data: [],
			yAxis: 0,
			color: color1,
			lineWidth: 3,
			tooltip: {
				valueSuffix: ' W/m^2'
			},
			marker: {
				enabled: false
			}
		},{
			name: 'Case Temperature',
			data: [],
			yAxis: 1,
			color: color2,
			lineWidth: 3,
			dashStyle: 'shortdash',
			tooltip: {
				valueSuffix: ' °C'
			},
			marker: {
				enabled: false
			}
		},{
			name: 'Dome Temperature',
			data: [],
			yAxis: 2,
			color: color3,
			lineWidth: 3,
			dashStyle: 'shortdot',
			tooltip: {
				valueSuffix: ' °C'
			},
			marker: {
				enabled: false
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
	var begin = Date.now()/1000 - 3600;
	var url = '/data/1/PIR.json?begin=' + begin;
	//console.log(url);
	$.getJSON(url,function(data) {
		//console.log(data);
		if (!(chart == null)) {
			var tmp = _.zip(data['ts'],data['ir_mV'],data['t_case_V'],data['t_dome_V']);
			for (var i = 0; i < tmp.length; i++) {
				addpoint({'ts':tmp[i][0],'ir_mV':tmp[i][1],'t_case_V':tmp[i][2],'t_dome_V':tmp[i][3]});
			}
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
		if (m.substr(0,i).includes("_PIR")) {
			var data = JSON.parse(m.substr(i+1));
			addpoint(data);
			check_liveliness();
		}
	};
	ws.onerror = function(evt) {
		console.log("error?")
	};

	setInterval(check_liveliness,5*1000);
});