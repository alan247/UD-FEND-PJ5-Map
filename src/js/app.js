	$('input').on('focus keydown', function(){
		if ($(window).width() <= 1024){
			$('.toggle-controls').css('display', 'none');
			$('.overlay, .list').css('display', 'block');
		}
	});


    $('.overlay, .close-icon, .toggle-controls').on('click', function(){
      	if ($(window).width() <= 1024){
			$('.toggle-controls, .overlay, .list').toggle();
		}
    });




var createMarker = function(name, lat, long, markerId) {
	var self = this;
	self.name = name;

  	var infoWindow = new google.maps.InfoWindow({
    	content: name
    });

  	var marker = new google.maps.Marker({
    	position: new google.maps.LatLng(lat, long),
    	title: name,
      	animation: google.maps.Animation.DROP,
    	map: map
    });

    marker.metadata = {
    	id: name
    }

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

	self.markersArray = ko.observableArray([
		new createMarker('Mexico City, Mexico', '19.3911658', '-99.4245083'),
		new createMarker('Berlin, Germany', '52.5076274', '13.1442608'),
		new createMarker('Munich, Germany', '48.1550543', '11.4014064'),
		new createMarker('Lodz, Poland', '51.7732467', '19.3401639'),
		new createMarker('San Diego, US', '32.7197381', '-117.3376007'),
		new createMarker('Lisbon, Portugal', '38.7437395', '-9.2304162'),
		new createMarker('Mazunte, Mexico', '15.6678736', '-96.570997')
	]);

	self.goToMarker = function() {
		//alert('clickedThis');

	};
}

ko.bindingHandlers.listClick = {
   init : function(element) {
	    $(element).on('click', function(){
    	$(this).siblings().removeClass('selected');
    	console.log('li clicked');
    	$(this).addClass('selected');
    	if ($(window).width() <= 1024){
			$('.toggle-controls, .overlay, .list').toggle();
		}
	});
}};

ko.applyBindings(new viewModel());





