
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





var ViewModel = function() {
	var self = this;

	self.initializeMap = function() {
		var mapCanvas = document.getElementById('map');
        var mapOptions = {
	      	center: new google.maps.LatLng(49.8333467,14.1009912),
	      	zoom: 3,
	      	mapTypeId: google.maps.MapTypeId.ROADMAP,
	      	disableDefaultUI: true,
	      	zoomControl: true
        }
        var map = new google.maps.Map(mapCanvas, mapOptions);
        var marker = new google.maps.Marker({
        	position: new google.maps.LatLng(19.3911658,-99.4245054),
        	title: 'Hola',
        	map: map
        });
	}
	self.initializeMap();
}

ko.applyBindings(new ViewModel());





