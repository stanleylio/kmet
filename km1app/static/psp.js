$(function() {
	var window_size = 1000;	// max sample count
	var preload = 3600;		// seconds
	
	var fields = ['psp_mV'];
	
	var chart;
	
	function conv(s) {
		return [1e3*s[0],s[1]];
	}

	function addpoint(d) {
		if (!(chart == null)) {
			var d = conv([d['ts'],d[fields[0]]]);
			var shifts = _.map(chart.series,function(v,i,c) {
				return v.data.length > window_size;
			});
			var shift = _.reduce(shifts,function(acc,val) {
				return acc || val;
			});
			$.each(fields,function(k,v) {
				chart.series[k].addPoint([d[0],d[k+1]],true,shift);
			});
		}
	}

	var color1 = 'purple';

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
			text: 'Global Shortwave Irradiance (PSP)'
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
			name: 'PSP',
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
		credits: {
			enabled: false
		},
	});
	
	// preload recent data
	var begin = Date.now()/1000 - preload;
	var url = '/data/1/PSP.json?begin=' + begin;
	//console.log(url);
	$.getJSON(url,function(data) {
		//console.log(data);
		if (!(chart == null)) {
			var tmp = _.zip(data['ts'],data[fields[0]]);
			tmp = tmp.sort(function(a,b) { return a[0] > b[0]; });

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
		if (m.substr(0,i).includes("_PSP")) {
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