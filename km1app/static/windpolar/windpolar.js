$(function () {
	var pointInterval = 5;
	var data = [];
	var last_received = Date.now();

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
			if (null != dir) {
				data[Math.round(dir/pointInterval)] = 1;
			}
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
			text: 'Apparent Wind Direction',
			style: {
				fontSize: '3em',
			}
		},
		subtitle: {
			text: 'Data from Port-side RM Young Anemometer',
			style: {
				fontSize: '1.5em',
			}
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
						var s =  (360 - this.value) + '\xB0';
						if (90 == 360-this.value) {
							return 'PORT';
						}
						return s;
					}
					var s = this.value + '\xB0';
					if (90 == this.value) {
						return 'STBD';
					}
					return s;
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

			var preferredunit = get_current_setting('apparent_wind_polar_speed_unit');
			if ('m/s' === preferredunit) {
				$('#label_windspeed').text(spd.toFixed(1) + ' ' + preferredunit);
			} else if ('km/h' === preferredunit) {
				$('#label_windspeed').text(ms2kmh(spd).toFixed(1) + ' ' + preferredunit);
			} else if ('kn' === preferredunit) {
				$('#label_windspeed').text(ms2knot(spd).toFixed(1) + ' ' + preferredunit);
			} else if ('mph' === preferredunit) {
				$('#label_windspeed').text(ms2mph(spd).toFixed(1) + ' ' + preferredunit);
			}
			
			last_received = Date.now();
		}
	};
	ws.onerror = function(evt) { console.log("error?") };

	// make the two columns the same height so that the bignum display can be vertically-centered
	$('.box').matchHeight();

	function check_liveliness() {
		if ((Date.now() - last_received)/1000 <= 5) {
			//console.log('fresh');
			$('body').css("-webkit-filter","");
			$('body').css("filter","");
		} else {
			//console.log('stale');
			$('body').css("-webkit-filter","grayscale(100%)");
			$('body').css("filter","grayscale(100%)");
			$('#label_winddirection').text('');
			$('#label_windspeed').text('');
			setdir(null);
		}
	}

	setInterval(check_liveliness,5*1000);
	
	function set_daynight(theme) {
		var polar = $('#winddirection');
		if (polar.highcharts() != null) {
			polar.highcharts().destroy();
		}
		$.getScript('/static/windpolar/' + theme + '1.js',function() {
			polar.highcharts(chart_options);
		});
	}
	
	var settings = {};
	//settings[ID] = [List of Options, index of default choice in List of Options];
	settings['apparent_wind_polar_speed_unit'] = [['m/s','km/h','kn','mph'],2];
	settings['apparent_wind_polar_daynight'] = [['day','night'],1];
	
	function get_current_setting(name) {
		var choices = settings[name][0];
		var default_choice = settings[name][1];
		var setting = localStorage.getItem(name);
		if ((setting == null) || ($.inArray(setting,choices) == -1)) {
			setting = choices[default_choice];
		}
		return setting;
	}
	
	// this also writes to localStorage
	function next_setting(name) {
		var choices = settings[name][0];
		var newchoice = choices[(choices.indexOf(get_current_setting(name)) + 1) % choices.length];
		localStorage.setItem(name,newchoice);	// !!
		//console.log(newchoice);
		return newchoice;
	}
	
	$('body').click(function() {
		var newchoice = next_setting('apparent_wind_polar_daynight');
		set_daynight(newchoice);
	});
	
	$('#label_windspeed').click(function(event) {
		next_setting('apparent_wind_polar_speed_unit');
		event.stopPropagation();
	});
	
	set_daynight(get_current_setting('apparent_wind_polar_daynight'));
});