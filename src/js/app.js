
	$('input').on('focus keydown', function(){
		if ($(window).width() <= 1024){
			$('.toggle-controls').css('display', 'none');
			$('.overlay, .list').css('display', 'block');
		}
	});


    $('.overlay, li, .close-icon, .toggle-controls').on('click', function(){
      	if ($(window).width() <= 1024){
			$('.toggle-controls, .overlay, .list').toggle();
		}
    });


function createMarker(name, lat, long) {
  	var infoWindow = new google.maps.InfoWindow({
    	content: name
    });

  	var marker = new google.maps.Marker({
    	position: new google.maps.LatLng(lat, long),
    	title: name,
    	map: map
    });

    marker.addListener('click', function() {
    	infoWindow.open(map, marker);
  	});
}


var map = new google.maps.Map(document.getElementById('map'), {
	center: new google.maps.LatLng(49.8333467,14.1009912),
  	zoom: 3,
  	mapTypeId: google.maps.MapTypeId.ROADMAP,
  	disableDefaultUI: true,
  	zoomControl: true
});



var viewModel = function() {
	var self = this;

	var markersArray = ko.observableArray([
		new createMarker('Mexico City', '19.3911658', '-99.4245083'),
		new createMarker('Berlin', '52.5076274', '13.1442608'),
		new createMarker('Munich', '48.1550543', '11.4014064'),
		new createMarker('Lodz', '51.7732467', '19.3401639'),
		new createMarker('San Diego', '32.7197381', '-117.3376007'),
		new createMarker('Lisbon', '38.7437395', '-9.2304162'),
		new createMarker('Mazunte', '15.6678736', '-96.570997')
	]);
}

ko.applyBindings(new viewModel());





