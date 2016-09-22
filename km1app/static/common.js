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
			var tmp = _.maxBy(chart.series[i].data,function(v) {
				return v.x;
			});
			tmp = tmp.x;
			if (tmp > max_t) {
				max_t = tmp;
			}
		}
		//var range = cal_time_range(chart.series[0].data);
		return (Date.now() + utcoffset - max_t) < bestbefore*1000;
	}
	return true;
}