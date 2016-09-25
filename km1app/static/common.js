var utcoffset = -(new Date()).getTimezoneOffset()*60*1000;

function ms2kmh(ms) {
	return ms*3600/1000;
}
function ms2knot(ms) {
	return ms*1.94384;
}
function ms2mph(ms) {
	return ms*2.23694;
}

function is_fresh(chart,bestbefore) {
	if (!(chart == null)) {
		var max_t = 0;
		/* have to search through all time series because if a time series
		 is hidden in highcharts by the user, the corresponding chart.series[i].data
		 doesn't get updated (and become stale, triggering the gracscale display).
		 */
		for (var i = 0; i < chart.series.length; i++) {
			if (chart.series[i].data.length <= 0) {
				return false;
			}
			var tmp = _.maxBy(chart.series[i].data,function(v) {
				return v.x;
			});
			tmp = tmp.x;
			if (tmp > max_t) {
				max_t = tmp;
			}
		}
		//var range = cal_time_range(chart.series[0].data);
		//console.log((Date.now() + utcoffset - max_t)/1000);
		//return (Date.now() + utcoffset - max_t)/1000 < bestbefore;
		return (Date.now() - max_t)/1000 < bestbefore;
	}
	return false;
}

function check_liveliness(chart,timeout) {
	if (is_fresh(chart,timeout)) {
		//console.log('fresh');
		$('body').css("-webkit-filter","");
		$('body').css("filter","");
	} else {
		//console.log('stale');
		$('body').css("-webkit-filter","grayscale(100%)");
		$('body').css("filter","grayscale(100%)");
	}
}
