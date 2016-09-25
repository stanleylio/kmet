$(function() {
	var window_size = 1000;	// max # of samples per series (some can be shorter than other)
	var preload = 3600;		// populate plot with data collected in the past "preload" seconds

	// 'ts' is implied - we are dealing with time series here, of course there's always a timestamp column
	var fields = ['ir_mV','t_case_V','t_dome_V'];
	//var convs = [function() {}, function() {}, function() {}, function() {}];
	
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
	
	// give a sample ([timestamp,field1,field2,field3...]), apply
	// any conversion (unit etc.) needed
	function conv(s) {
		return [
			1000*s[0],			// POSIX in seconds, js in milliseconds
			s[1],				// TOOD missing calibration factor
			r2t(v2r(s[2])),		// convert voltage to temperature
			r2t(v2r(s[3])),
		];
	}
	
	function addpoint(d) {
		if (!(chart == null)) {
			var d = conv([d['ts'],d[fields[0]],d[fields[1]],d[fields[2]]]);

			// shift the window if any of the series is longer than window_size
			// get a list of bools
			var shifts = _.map(chart.series,function(v,i,c) {
				return v.data.length > window_size;
			});
			// reduce the list of bools to one bool (shift)
			var shift = _.reduce(shifts,function(acc,val) {
				return acc || val;
			});

			$.each(fields,function(k,v) {
				chart.series[k].addPoint([d[0],d[k+1]],true,shift);
			});
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
		credits: {
			enabled: false
		},
	});
	
	// TODO
	// slowly molding it into a reusale form... all real-time plots share these.

	// preload recent data
	var begin = Date.now()/1000 - preload;
	var url = '/data/1/PIR.json?begin=' + begin;
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
			$.each(fields,function(k,v) {
				chart.series[k].setData(_.map(tmp,function(v,i,c) { return [v[0],v[k+1]]; }),false,false);
			});
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
		if (m.substr(0,i).includes("_PIR")) {
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