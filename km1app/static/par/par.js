$(function() {
	var chart;

	function addpoint(d) {
		if (!(chart == null)) {
			var window_size = 3600;
			var ts = d['ts']*1000;
			var par_V = d['par_V'];
			var series = chart.series[0];
			var shift = series.data.length > window_size;
			chart.series[0].addPoint([ts,par_V],true,shift);
		}
	}

	function check_liveliness() {
		function is_fresh() {
			if (!(chart == null)) {
				var max_t = 0;
				for (var i = 0; i < chart.series[0].data.length; i++) {
					var x = chart.series[0].data[i].x;
					if (x > max_t) {
						max_t = x;
					}
				}
				return (Date.now() - max_t) < 2*60*1000;
			}
			//console.log("chart not ready");
			return true;
		}

		if (is_fresh()) {
			//console.log('fresh');
			$('body').css("-webkit-filter","");
			$('body').css("filter","");
		} else {
			//console.log('stale');
			$('body').css("-webkit-filter","grayscale(100%)");
			$('body').css("filter","grayscale(100%)");
		}
	}

	var color1 = 'green';

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
			text: 'Photosynthetically Active Radiation'
		},
		/*subtitle: {
			text: 'subtitle',
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
					color: color1
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
		}],
		tooltip: {
			shared: true
		},
		series: [{
			name: 'PAR',
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
		}],
		tooltip: {
			enabled: true
		},
		legend: {
			enabled: false,
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
		if (m.substr(0,i).includes("_PAR")) {
			var data = JSON.parse(m.substr(i+1));
			addpoint(data);
			check_liveliness();
		}
	};
	ws.onerror = function(evt) {
		console.log("error?")
	};

	setInterval(check_liveliness,5*60*1000);
});