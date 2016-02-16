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

////////////////////////////////

var viewModel = function() {
	var self = this;
	self.infoWindow = new google.maps.InfoWindow();

	self.filter = ko.observable('');
	var markersFinalArray = ko.observableArray([]);

	self.filteredItems = ko.computed(function() {
	    var filter = self.filter().toLowerCase();
	    if (!filter) {
	        return markersFinalArray();
	    } else {
	        return ko.utils.arrayFilter(markersFinalArray(), function(mark) {
				var string = mark.name.toLowerCase();
				console.log(string);
				if (string.search(filter) >= 0 ) {
					return true;
				} else {
					return false;
				}
	        });
	    }
	});

	var map = new google.maps.Map(document.getElementById('map'), {
		center: new google.maps.LatLng(49.8333467,14.1009912),
	  	zoom: 3,
	  	mapTypeId: google.maps.MapTypeId.ROADMAP,
	  	disableDefaultUI: true,
	  	zoomControl: true
	});

	var clickOnItem = function(name, marker, lat, long) {
		self.infoWindow.setContent(name);
    	self.infoWindow.open(map, marker);
    	var coords = new google.maps.LatLng(lat, long);
		map.panTo(coords);
		map.setZoom(6);
		map.panBy(0, -100);
	}

	var createMarker = function(name, lat, long, markerId) {
		var self = this;
		self.name = name;
		self.lat = lat;
		self.long = long;

	  	var marker = new google.maps.Marker({
	    	position: new google.maps.LatLng(lat, long),
	    	title: name,
	      	animation: google.maps.Animation.DROP,
	    	map: map
	    });

	  	markersFinalArray.push({
	  		marker: marker,
	  		name: name,
	  		lat: lat,
	  		long: long
	  	});


	    marker.addListener('click', function() {
	    	clickOnItem(name, marker, lat, long);
	  	});
	};


	self.locationsData = ko.observableArray([
		new createMarker('Mexico City, Mexico', '19.3911658', '-99.4245083'),
		new createMarker('Berlin, Germany', '52.5076274', '13.1442608'),
		new createMarker('Munich, Germany', '48.1550543', '11.4014064'),
		new createMarker('Lodz, Poland', '51.7732467', '19.3401639'),
		new createMarker('San Diego, US', '32.7197381', '-117.3376007'),
		new createMarker('Lisbon, Portugal', '38.7437395', '-9.2304162'),
		new createMarker('Mazunte, Mexico', '15.6678736', '-96.570997'),
		new createMarker('Paris, France', '48.856614', '2.352222'),
		new createMarker('Rome, Italy', '41.902783', '12.496366'),
		new createMarker('Warsaw, Poland', '52.229676', '21.012229'),
		new createMarker('Wien, Austria', '48.208174', '16.373819'),
		new createMarker('Madrid, Spain', '40.416775', '-3.703790'),
		new createMarker('Reykjavik, Iceland', '64.126521', '-21.817439'),
		new createMarker('Guatemala City, Guatemala', '14.634915', '-90.506882'),
		new createMarker('Amsterdam, Netherlands', '52.370216', '4.895168'),
		new createMarker('Prague, Czech Republic', '50.075538', '14.437800')
	]);



	self.goToMarker = function(clickedItem) {
		var markerName = clickedItem.name;
		for(var key in markersFinalArray()) {
			if(markerName === markersFinalArray()[key].name) {
				var marker = markersFinalArray()[key].marker;
				var markerLat = markersFinalArray()[key].lat;
				var markerLong = markersFinalArray()[key].long;
				clickOnItem(markerName, marker, markerLat, markerLong);
				console.log(markersFinalArray());
			}
		}
	};


}




/////////////////////////////////

ko.bindingHandlers.listClick = {
    init : function(element) {
	    $(element).on('click', function(){
    	$(this).siblings().removeClass('selected');
    	$(this).addClass('selected');
    	if ($(window).width() <= 1024){
			$('.toggle-controls, .overlay, .list').toggle();
		}
	});
}};

ko.applyBindings(new viewModel());





