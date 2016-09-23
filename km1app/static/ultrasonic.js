$(function() {
	var chart;
	
	function addpoint(d) {
		if (!(chart == null)) {
			var window_size = 3600;
			var ts = d['ts']*1000;
			var apparent_speed_mps = d['apparent_speed_mps'];
			var apparent_direction_deg = d['apparent_direction_deg'];
			
			var shift = _.maxBy(chart.series,function(v) {
				return v.data.length;
			}) > window_size;
			//var shift = chart.series[0].data.length > window_size;
			chart.series[0].addPoint([ts,apparent_speed_mps],true,shift);
			chart.series[1].addPoint([ts,apparent_direction_deg],true,shift);
		}
	}

	function check_liveliness() {
		if (is_fresh(chart,60)) {
			//console.log('fresh');
			$('body').css("-webkit-filter","");
			$('body').css("filter","");
		} else {
			//console.log('stale');
			$('body').css("-webkit-filter","grayscale(100%)");
			$('body').css("filter","grayscale(100%)");
		}
	}

	var color1 = '#AD0062';
	var color2 = '#87CA00';

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
			text: 'Apparent Wind'
		},
		subtitle: {
			text: 'Data from the RM Young 85106 ultrasonic anemometer',
			style: {
				fontSize: '1.5em'
			}
		},
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
				format: '{value}m/s',
				style: {
					color: color1,
					fontSize: '1.5em'
				}
			},
			title: {
				text: 'Apparent Wind Speed',
				margin: 30,
				style: {
					fontSize: '2em',
					color: color1
				}
			}
		},{
			minRange: 0,
			maxRange: 360,
			gridLineWidth: 0,
			labels: {
				format: '{value}°',
				style: {
					color: color2,
					fontSize: '1.5em'
				}
			},
			title: {
				text: 'Apparent Wind Direction',
				style: {
					fontSize: '2em',
					color: color2
				}
			},
			opposite: true
		}],
		tooltip: {
			shared: true
		},
		series: [{
			name: 'Speed',
			data: [],
			yAxis: 0,
			color: color1,
			lineWidth: 3,
			tooltip: {
				valueSuffix: ' m/s'
			},
			marker: {
				enabled: false
			}
		},{
			name: 'Direction',
			data: [],
			yAxis: 1,
			color: color2,
			lineWidth: 3,
			dashStyle: 'shortdash',
			tooltip: {
				valueSuffix: ' °'
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
		if (m.substr(0,i).includes("_UltrasonicWind")) {
			var data = JSON.parse(m.substr(i+1));
			addpoint(data);
			check_liveliness();
		}
	};
	ws.onerror = function(evt) {
		console.log("error?")
	};

	setInterval(check_liveliness,60*1000);
});