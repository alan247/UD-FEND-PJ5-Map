var viewModel = function() {
	var self = this;
	self.infoWindow = new google.maps.InfoWindow();
	self.wikiArticles = ko.observableArray();
	self.filter = ko.observable('');
	var markersFinalArray = ko.observableArray([]);
	var infoWindowHTML = $('#info-window');


	// All the filtering happens here
	self.filteredItems = ko.computed(function() {

		// // Close any currently open infowindow
		 self.infoWindow.close();


		// Set the filter words specified by the user to lower case
	    var filter = self.filter().toLowerCase();

	    // If the filter box is empty, return the full array and show all markers
	    if (!filter) {
	    	for (var i = 0; i < markersFinalArray().length; i++) {
	        	markersFinalArray()[i].marker.setVisible(true);
	        }
	        return markersFinalArray();

	    // If the user has entered something into the filter box, use knockout's utility function 'arrayFilter' to get filtered results
	    } else {
	    	return ko.utils.arrayFilter(markersFinalArray(), function(mark) {

	    		// Loop through all the entries in the markers array
				for (var key in markersFinalArray()) {

					// Set the marker name to lowercase to compare with filter
					var markerName = markersFinalArray()[key].name.toLowerCase();

					// If the result of the 'search' method is equal or more than zero, set matching markers' visibility to true
					if(markerName.search(filter) >= 0) {
						markersFinalArray()[key].marker.setVisible(true);

					// Else, hide them
					} else {
						markersFinalArray()[key].marker.setVisible(false);
					}
				}

				// From the markers array, return only those items that match the filter. This is used to filter the list of items, not the markers.
				return mark.name.toLowerCase().search(filter) >= 0;
	        });
	    }
	});

	// Google maps init
	var map = new google.maps.Map(document.getElementById('map'), {
		center: new google.maps.LatLng(40.8333467,-48.1009912),
	  	zoom: 2,
	  	mapTypeId: google.maps.MapTypeId.ROADMAP,
	  	disableDefaultUI: true,
	  	zoomControl: true
	});

	// Markers processing function
	var createMarker = function(name, lat, long) {

		// Create marker with given data and add it to the final markers array
	  	markersFinalArray.push({
	  		marker: new google.maps.Marker({
		    	position: new google.maps.LatLng(lat, long),
		    	title: name,
		      	animation: google.maps.Animation.DROP,
		    	map: map
		    }),
	  		name: name,
	  		lat: lat,
	  		long: long
	  	});

	  	// Add click listener to the fresly created marker
	  	var maLength = markersFinalArray().length;
	  	var maLast = markersFinalArray()[maLength - 1];
	  	var maItem = maLast.marker;
	  	var maName = maLast.name;
	  	var maLat = maLast.lat;
	  	var maLong = maLast.long;

	  	maItem.addListener('click', function() {
	    	self.clickOnItem(maName, maItem, maLat, maLong);
	  	});
	};

	// Hardcoded locations data
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


	self.clickOnItem = function(name, marker, lat, long) {

		$("body").append(infoWindowHTML);
		self.infoWindow.close();

		marker.setAnimation(google.maps.Animation.BOUNCE);
    	setTimeout(function(){
    		marker.setAnimation(null);
    		self.infoWindow.open(map, marker);
    	}, 750);
    	var coords = new google.maps.LatLng(lat, long);

		map.panTo(coords);
		map.setZoom(5);
		map.panBy(0, -210);

		var apiCoords = lat+'|'+long;

		self.getWikiData(apiCoords, marker);
	};

	// Function accesed from the VIEW. Uses the name from the clicked item on the list and calls clickOnItem() with its data.
	self.goToMarker = function(clickedItem) {
		var markerName = clickedItem.name;
		for(var key in markersFinalArray()) {
			if(markerName === markersFinalArray()[key].name) {
				var marker = markersFinalArray()[key].marker;
				var markerLat = markersFinalArray()[key].lat;
				var markerLong = markersFinalArray()[key].long;
				self.clickOnItem(markerName, marker, markerLat, markerLong);
				self.filter(markerName);
				setTimeout(function(){
		    		self.infoWindow.open(map, marker);
		    	}, 750);
			}
		}
	};

	// Clears the filter input and re-centers the map on click "X"
	self.clearFilter = function() {
		self.filter('');
		var coords = new google.maps.LatLng(40.8333467,-48.1009912);
		map.panTo(coords);
		map.setZoom(2);
	};

	// Clear filter input when an infowindow is closed
	google.maps.event.addListener(self.infoWindow,'closeclick',function(){
		self.clearFilter();
		$("body").append(infoWindowHTML);
	});



	// Closes infowindows when the map is clicked
	google.maps.event.addListener(map, "click", function(event) {
		var map = self.infoWindow.getMap();

		// Only act if an infowindow is open
		if (map !== null && typeof map !== 'undefined' ) {
			self.infoWindow.close();
	    	self.clearFilter();
    	}

		$("body").append(infoWindowHTML);
	});

	/////////////////////////////////

	self.getWikiData = function(coords, marker) {

		// Empty wikiArticles array
		self.wikiArticles().length = 0;

		// Define wiki api url
		var wikiURL = 'https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages%7Cinfo&list=&generator=geosearch&piprop=thumbnail&pithumbsize=80&pilimit=4&inprop=url&ggscoord=' + coords +'&ggsradius=10000&ggslimit=4&callback=?';

		$.getJSON(wikiURL, function(data){

			var wikiItems = data.query.pages;

			$.each(wikiItems, function(k, v) {
				var wikiTitle = v.title;
				var wikiURL = v.fullurl;

				if ('thumbnail' in v) {
					var wikiThumb = v.thumbnail.source;
					var wikiThumbW = v.thumbnail.width;
					var wikiThumbH = v.thumbnail.height;
				} else {
					var wikiThumb = 'http://thumbnail.image.rakuten.co.jp/@0_mall/com/css/c/pc/img/nopicture/nopicture.gif?_ex=128x128';
				}

				var wikiObject = {
					title : wikiTitle,
					thumbnail : wikiThumb,
					thumbnailWidth : wikiThumbW,
					thumbnailHeight : wikiThumbH,
					url : wikiURL
				}

				self.wikiArticles.push(wikiObject);

			});




			console.log(self.wikiArticles());
			console.log(infoWindowHTML);

			self.infoWindow.setContent(infoWindowHTML[0]);






		}).fail(function(){
			console.log('fail ajax');
		});


	}


}

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



// if ($('input').val() !== '') {
// 	$('.clear-filter').css('display', 'block');
// } else {
// 	$('.clear-filter').css('display', 'none');
// }



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




