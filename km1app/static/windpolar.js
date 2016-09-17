$(function () {
	var pointInterval = 5;
	var data = [];

	function ms2kmh(ms) {
		return ms*3600/1000;
	}
	function ms2knot(ms) {
		return ms*1.94384;
	}
	function ms2mph(ms) {
		return ms*2.23694;
	}

	function setdir(dir) {
		var chart = $('#winddirection').highcharts();
		if (chart) {
			var data = Array(Math.floor(360/pointInterval)).fill(0);
			data[Math.round(dir/pointInterval)] = 1;
			chart.series[0].setData(data,true);
		}
	}

	var chart_options = {
		chart: {
			polar: true,
			type: 'column',
			animation: false
		},
		title: {
			text: 'Apparent Wind Direction'
		},
		subtitle: {
			text: "Data from Port-side RM Young Anemometer"
		},
		pane: {
			startAngle: 0,
			endAngle: 360
		},
		xAxis: {
			//tickInterval: 45/2,
			tickInterval: 45,
			min: 0,
			max: 360,
			labels: {
				formatter: function () {
					if (this.value > 180) {
						return (360 - this.value) + '\xB0';
					}
					return this.value + '\xB0';
					//return this.value + '\xB0';
					//var dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
					//return dirs[Math.round(this.value/360*(360/(45/2)))];
				}
			}
		},
		yAxis: {
			min: 0,
			max: 1,
			labels: {
				format: "{}"
			}
		},
		plotOptions: {
			series: {
				pointStart: 0,
				pointInterval: pointInterval
			},
			column: {
				pointPadding: 0,
				groupPadding: 0
			}
		},
		legend: {
			enabled: false
		},
		credits: {
			enabled: false
		},
		tooltip: {
			enabled: false
		},
		series: [{
			type: 'column',
			name: 'Column',
			data: data,
			color: 'red',
			pointPlacement: 'on'
		}]
	};
	
	$('#winddirection').highcharts(chart_options);

	var url = "ws://" + String(window.location.host) + ":9000";
//console.log(url);
	//ws = new WebSocket(url);
	ws = new ReconnectingWebSocket(url);
	ws.onopen = function(evt) {
		//console.log(evt);
	};
	ws.onclose = function(evt) {
		//console.log("closed");
	};
	ws.onmessage = function(evt) {
		//console.log(evt.data);
		var m = evt.data;
		var i = m.indexOf(',');
		if (m.substr(0,i).includes("_PortWind")) {
			var data = JSON.parse(m.substr(i+1));
			var dir = data['apparent_direction_deg'];
			var spd = data['apparent_speed_mps'];
			setdir(dir);
			
			$('#label_winddirection').text(dir.toFixed(0) + '\xB0');

			var preferredunit = get_unit();
			if ('m/s' === preferredunit) {
				$('#label_windspeed').text(spd.toFixed(1) + ' ' + preferredunit);
			} else if ('km/h' === preferredunit) {
				$('#label_windspeed').text(ms2kmh(spd).toFixed(1) + ' ' + preferredunit);
			} else if ('kn' === preferredunit) {
				$('#label_windspeed').text(ms2knot(spd).toFixed(1) + ' ' + preferredunit);
			} else if ('mph' === preferredunit) {
				$('#label_windspeed').text(ms2mph(spd).toFixed(1) + ' ' + preferredunit);
			}
		}
	};
	ws.onerror = function(evt) { console.log("error?") };

	// make the two columns the same height so that the bignum display can be vertically-centered
	$('.box').matchHeight();

	function set_daynight(theme) {
		if ($.inArray(theme,['day','night']) > -1) {
			var polar = $('#winddirection');
			if (polar.highcharts() != null) {
				polar.highcharts().destroy();
			}
			$.getScript('/static/' + theme + '1.js',function() {
				polar.highcharts(chart_options);
				localStorage.setItem('ultrasonic_anemometer_daynight',theme);
			});
		}
	}
	
	$('body').click(function() {
		var theme = get_daynight();
		if ('night' === theme) {
			set_daynight('day');
		} else {
			set_daynight('night');
		}
	});
	
	var units = ['m/s','km/h','kn','mph'];
	function get_unit() {
		var unit = localStorage.getItem('ultrasonic_anemometer_speed_unit');
		if ((unit == null) || ($.inArray(unit,units) == -1)) {
			unit = units[2];
		}
		return unit;
	}
	function get_daynight() {
		var daynight = localStorage.getItem('ultrasonic_anemometer_daynight');
		if ((daynight == null) || ($.inArray(daynight,['day','night']) == -1)) {
			daynight = units[0];
		}
		return daynight;
	}
	
	$('#label_windspeed').click(function(event) {
		var preferredunit = get_unit();
		var newunit = units[(units.indexOf(preferredunit) + 1) % units.length];
		console.log(newunit);
		localStorage.setItem('ultrasonic_anemometer_speed_unit',newunit);
		event.stopPropagation();
	});
	
	$(function() {
		var theme = get_daynight();
		set_daynight(theme);
	});
	$(function() {
		set_daynight('night');
	});

});