$(function() {
	// not yet tested/available: PortWind,StarboardWind,OpticalRain,Rain,Humidity
	var sensors = ['PAR','PIR','PSP','Port Wind','Starboard Wind','Ultrasonic Wind','Optical Rain','BME280'];
	var tags = ['PAR','PIR','PSP','PortWind','StarboardWind','UltrasonicWind','OpticalRain','BME280'];
	var sample_periods = [10,10,10,1,1,1,5,60];
	
	var ul = $('<ul class="list-group"></ul>');
	$.each(_.zip(sensors,tags,sample_periods),function(k,v) {
		var li = $('<a/>',{
			href:'/by_sensor/' + v[1] + '/',
			class:"list-group-item",
			text:v[0],
			title:v[0],
			"data-tag":v[1],
			"data-sample-period":v[2]});
		ul.append(li);
	});
	$('#status_table').html(ul);
	
	function check_status() {
		$('#status_table ul a').each(function(k,v) {
			var tag = $(v).data('tag');
			var period = $(v).data('sample-period');
			var begin = Date.now()/1000 - Math.max(5*period,60);	// timeout = max of {5x sampling period, or 1 minute}
			var url = '/data/1/' + tag + '.json?begin=' + begin;	// the latter is needed for difference in devices' clocks
			$.getJSON(url,function(data) {
				if (data['ts'].length > 0) {
					$(v).addClass('list-group-item-success');
					$(v).removeClass('list-group-item-warning');
					$(v).removeClass('list-group-item-danger');
				} else {
					$(v).removeClass('list-group-item-success');
					$(v).removeClass('list-group-item-warning');
					$(v).addClass('list-group-item-danger');
				}
				/*var ago = Date.now()/1000 - _.max(data['ts']);
				if () {
					$(this).addClass('list-group-item-success');
				} else if ('bad_sensor' === tmp) {
					$(this).addClass('list-group-item-warning');
				} else if ('offline' === tmp) {
					$(this).addClass('list-group-item-danger');
				}*/
			});
		});
	}
	
	check_status();
	
	window.setInterval(check_status,10*1000);
});