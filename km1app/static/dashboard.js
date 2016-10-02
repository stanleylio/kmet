$(function() {
	// not yet available: PortWind,StarboardWind,Rain,Humidity,BME280
	var sensors = ['PAR','PIR','PSP','Ultrasonic Wind','Optical Rain'];
	var tags = ['PAR','PIR','PSP','UltrasonicWind','OpticalRain'];
	var sample_periods = [10,10,10,1,5];
	
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
			var begin = Date.now()/1000 - 5*period;
			var url = '/data/1/' + tag + '.json?begin=' + begin;
			$.getJSON(url,function(data) {
				if (data['ts'].length > 0) {
					$(v).addClass('list-group-item-success');
				} else {
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