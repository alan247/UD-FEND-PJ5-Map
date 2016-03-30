var viewModel = function() {
    var self = this;

    // Define observables
    self.wikiArticles = ko.observableArray();
    self.flickrPics = ko.observableArray();
    self.filter = ko.observable('');
    self.currentCityCountry = ko.observable('');
    self.currentCity = ko.observable('');
    self.currentLocationData = ko.observable('');
    self.markersFinalArray = ko.observableArray([]);

    // Init Google Maps
    var map = new google.maps.Map(document.getElementById('map'), {
        center: new google.maps.LatLng(40.8333467, -48.1009912),
        zoom: 2,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        zoomControl: false
    });

    // Init Google Maps geocoder
    var geocoder = new google.maps.Geocoder();

    // Init Google Maps autocomplete (useful for adding new locations)
    var autocomplete = new google.maps.places.Autocomplete(document.getElementById('pac-input'), {
        bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(-90, -180),
            new google.maps.LatLng(90, 180)),
        types: ['(cities)'] // Limit results to only cities, due to nature of the app (avoid businesses and other irrelevant results)
    });

    // Creates a marker with geocoded input which should be result of a Google Maps Places API call.
    self.geocodeInput = function() {

        // Get autocomplete result by checking the value of the input
        var address = $('#pac-input').val();

        // Pass the value to Google Maps' geocode method
        geocoder.geocode( { 'address': address}, function(results, status) {

            // If geocode request is succesful
            if (status == google.maps.GeocoderStatus.OK) {

                // Re-center map to the new location
                map.setCenter(results[0].geometry.location);

                // Extract name and coordinates from geocode results
                var cityName = results[0].formatted_address;

                // Geocode returns a LatLng object, so in order to get the lat and long, we need to use lat() and lng() methods
                var cityLat = results[0].geometry.location.lat();
                var cityLong = results[0].geometry.location.lng();

                // Call our marker creator with the new marker's info
                new createMarker(cityName, cityLat, cityLong, true);

                // Store the locations marker in localstorage
                self.storeLocally();

            } else {

                // If geocoding fails, display an alert box with the cause of the error
                alert("Geocode was not successful for the following reason: " + status);
            }
        });
    };

    // Local storage management
    self.storeLocally = function(){

        // Create a new array with self.markersFinalArray() data. For each item we need: lat, lng and name. We leave out the marker. This is necessary because JSON.stringify cannot do its job in an array that contains objects containing GMaps markers

        // Store markers array in a variable
        var markers = self.markersFinalArray();

        // Create array for storage
        var storeArray = [];

        // Loop through stored markers and create an object with all its elements excluding the marker
        $.each(markers, function(k, v) {
            markerObject = {
                name: v.name,
                lat: v.lat,
                long: v.long,
                userCreated: v.userCreated
            }

            // Push object into the array we have for storage
            storeArray.push(markerObject);

        });

        // Stringify the array and store it in the browser's local Storage
        localStorage.setItem('userLocalData', JSON.stringify(storeArray));
    };

    // Listens for 'enter' key. Hides the overlay and calls geocodeInput
    $('#pac-input').keyup(function (e) {
        if (e.keyCode == 13) {
            $('#add-overlay').hide();
            self.geocodeInput();
        }
    });

    // Marker processing function
    var createMarker = function(name, lat, long, userCreated) {

        // Create marker with given data and add it to the final markers array
        self.markersFinalArray.push({

            // Data for Google Maps API marker
            marker: new google.maps.Marker({
                position: new google.maps.LatLng(lat, long),
                title: name,
                animation: google.maps.Animation.DROP,
                map: map,
                icon: ((userCreated)?'http://maps.google.com/mapfiles/ms/micons/blue.png':'http://maps.google.com/mapfiles/ms/micons/red.png')
            }),
            name: name,
            lat: lat,
            long: long,
            userCreated: userCreated
        });

        // Select last item in markersFinalArray (the one we have just created and pushed) and assign its values to variables so that we can use them next to create a click event listener
        var maLength = self.markersFinalArray().length;
        var maLast = self.markersFinalArray()[maLength - 1];
        var maItem = maLast.marker;
        var maName = maLast.name;
        var maLat = maLast.lat;
        var maLong = maLast.long;

        // Add click listener to the fresly created marker
        maItem.addListener('click', function() {
            self.clickOnItem(maName, maItem, maLat, maLong, userCreated);
        });
    };

    // Delete Marker
    self.deleteMarker = function(clickedItem){

        // Store name of clicked item in variable
        var name = clickedItem.name;

        // Store markersFinalArray in variable for simplicity
        var mfa = self.markersFinalArray;

        // Loop through all items in markersFinalArray
        for (var key in mfa()) {

            // Match only if the clicked item name is the same as the current being looped through
            if (name === mfa()[key].name) {

                // Remove marker in Google Maps API
                mfa()[key].marker.setMap(null);

                // Remove item from the markers array
                mfa().splice(key, 1);

                // Update the markers array
                mfa(mfa());

                // Call local storage function to save changes to browser
                self.storeLocally();
            }
        }
    };


    // Initial markers management
    // Check if there's any local storage with data from previous sessions and load it.
    if (localStorage.getItem('userLocalData') !== null) {

        // Get local storage and parse it to JSON
        var storedData = JSON.parse(localStorage.getItem('userLocalData'));

        // Loop through all items and create markers for each one
        $.each(storedData, function(k, v) {
            var lat = v.lat;
            var long = v.long;
            var name = v.name;
            var userCreated = v.userCreated;

            // Call marker creater with data from the current item
            new createMarker(name, lat, long, userCreated);
        });
    } else { // If there's no local storage...

        // Get Initial locations from the server I set up for this purpose
        var initialLocationsURL = 'http://paperbac.pairserver.com/locations.php';

        // Make ajax call to get sample default locations
        $.getJSON(initialLocationsURL, function(data) {

            var locations = data.locations;

            // Loop through obtained JSON and assign variables
            $.each(locations, function(k, v) {

                var cityCountry = v.city + ', ' + v.country;  // Format city and country
                var latitude = v.latitude;
                var longitude = v.longitude;

                // Call marker creator. Last parameter (userCreated) is set to false since the user didn't create the marker. All markers set this way will appear red on the map
                new createMarker(cityCountry, latitude, longitude, false);
            });

        }).fail(function() {

            // If getting the sample markers failed for whatever reason, show alert box
            alert('Could not load sample markers from the server, but feel free to add your own!');
        });
    }

    // Process click on a marker or list item
    self.clickOnItem = function(name, marker, lat, long, userCreated) {

        // Manage styling. Loop through all items on the list
        $('.list-container ul li').each(function(){

            // Store html from current item in variable
            var thisName = $(this).children('.list-item').html();

            // Compare variable with name given to function
            if(name === thisName) {

                // Add 'selected' class to current item and remove it from the others
                $(this).addClass('selected').siblings().removeClass('selected');
            }

        });

        // Manage icon color
        self.changeIcons();

        // Split current City, Country
        var splitCity = name.split(',');

        // Store current city name in an observable variable so that it can be displayed on an info window
        self.currentCity(splitCity[0]);

        // Same thing as above, but this time city and Country
        self.currentCityCountry(name);

        // Store the new current location data. This will be used by changeIcons() to get the old marker when a new marker is clicked on the future
        self.currentLocationData(name+'|'+userCreated);

        // Show location window with info from third party API's
        $('#location-info').show();

        // Show list when viewportsize is less than 1024px
        if ($(window).width() <= 1024) {
            $('#locations-list').css('left', '0');
        }

        // Set icon of selected item to a special starred one
        var icon;
        var userSelectedIcon = 'http://maps.google.com/mapfiles/kml/paddle/blu-stars.png';
        var defaultSelectedIcon = 'http://maps.google.com/mapfiles/kml/paddle/red-stars.png'

        // Use red or blue depending on whether the user created the marker or not
        if(userCreated){
            icon = userSelectedIcon;
        } else {
            icon = defaultSelectedIcon;
        }

        // Set the marker
        marker.setIcon(icon);

        // ... and animate it
        marker.setAnimation(google.maps.Animation.BOUNCE);

        // Stop animation after 750ms
        setTimeout(function() {
            marker.setAnimation(null);
        }, 750);

        // Center map on item
        var coords = new google.maps.LatLng(lat, long);
        map.panTo(coords);
        map.setZoom(5);

        // Get current viewport width
        var windowWidth = $(window).width();

        // If viewport is bigger than 1024, pan the map accordingly.
        if ($(window).width() <= 1024) {
            map.panBy(0, -210);
        } else {
            var calculatedCenter = windowWidth * .5 / 2;
            map.panBy(-(calculatedCenter), -210);
        }

        // Make API calls
        self.getWikiData(lat, long);
        self.getFlickrData(lat, long, name);

        // Destroy lightgallery if it exists, so that a new one can be created without issues
        if ($('#flickr-gallery').data('lightGallery') != null) {
            $('#flickr-gallery').data('lightGallery').destroy(true);
        }
    };

    // Function accesed from the VIEW. Uses the name from the clicked item on the list and calls clickOnItem() with its data.
    self.goToMarker = function(clickedItem) {

        // Store clicked item name in variable
        var markerName = clickedItem.name;

        // Store markers array in variable for simplicity
        var mfa = self.markersFinalArray();

        // Loop through each markers array
        for (var key in mfa) {

            // If clicked item and current item on mfa match call clickOnItem()
            if (markerName === mfa[key].name) {
                var marker = mfa[key].marker;
                var markerLat = mfa[key].lat;
                var markerLong = mfa[key].long;
                var userCreated = mfa[key].userCreated;

                // Call clickOnItem with current data
                self.clickOnItem(markerName, marker, markerLat, markerLong, userCreated);
            }
        }
    };

    // Clears the filter input
    self.clearFilter = function() {
        self.filter('');
    };

    // 'ESC' key listener when filter is on focus. It  calls clearFilter()
    if ($('#locations-filter').is(':focus')) {
        if (e.keyCode == 27) {
            self.clearFilter();
        }
    }

    // Change 'old' marker icons to unselected state when a new one is selected
    self.changeIcons = function() {

        // Get current selected item data
        var currentData = self.currentLocationData().split('|');

        // Store data in variables
        var markerName = currentData[0];
        var userCreated = currentData[1];

        // Simplification ;)
        var mfa = self.markersFinalArray();

        // Loop through markers final array
        for (var key in mfa) {

            // If currently selected marker matches with current item in loop...
            if (markerName === mfa[key].name) {

                // Store marker in variable for simplicity
                var marker = mfa[key].marker;

                // Set either red or blue marker icon depending on the origin of the marker
                if(userCreated === 'true') {
                    marker.setIcon('http://maps.google.com/mapfiles/ms/micons/blue.png');
                } else {
                    marker.setIcon('http://maps.google.com/mapfiles/ms/micons/red.png');
                }
            }
        }
    };

    // The filtering happens here
    self.filteredItems = ko.computed(function() {

        // Set the filter words specified by the user to lower case
        var filter = self.filter().toLowerCase();

        // If the filter box is empty, return the full array and show all markers
        if (!filter) {
            for (var i = 0; i < self.markersFinalArray().length; i++) {
                self.markersFinalArray()[i].marker.setVisible(true);
            }
            return self.markersFinalArray();

        } else {

             // If the user has entered something into the filter box, use knockout's utility function 'arrayFilter' to get filtered results
            return ko.utils.arrayFilter(self.markersFinalArray(), function(mark) {

                // Loop through all the entries in the markers array
                for (var key in self.markersFinalArray()) {

                    // Set the marker name to lowercase to compare with filter
                    var markerName = self.markersFinalArray()[key].name.toLowerCase();

                    // If the result of the 'search' method is equal or more than zero, set matching markers' visibility to true
                    if (markerName.search(filter) >= 0) {
                        self.markersFinalArray()[key].marker.setVisible(true);

                        // Else, hide them
                    } else {
                        self.markersFinalArray()[key].marker.setVisible(false);
                    }
                }

                // From the markers array, return only those items that match the filter. This is used to filter the list of items, not the markers.
                return mark.name.toLowerCase().search(filter) >= 0;
            });
        }
    });

    // Wikipedia API manager
    self.getWikiData = function(lat, long) {

        // Empty wikiArticles observable array
        self.wikiArticles().length = 0;

        // Format coords for API call
        var apiCoords = lat + '|' + long;

        // Define wiki api url
        var wikiURL = 'https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages%7Cinfo&list=&generator=geosearch&piprop=thumbnail&pithumbsize=80&pilimit=4&inprop=url&ggscoord=' + apiCoords + '&ggsradius=10000&ggslimit=4&callback=?';

        // Make AJAX call
        $.getJSON(wikiURL, function(data) {

            // Store JSON structure in variable for easier coding
            var wikiItems = data.query.pages;

            // Loop through received JSON
            $.each(wikiItems, function(k, v) {
                var wikiTitle = v.title;
                var wikiURL = v.fullurl;

                // Check if item has thumbnail and assign it's details to variables
                if ('thumbnail' in v) {
                    var wikiThumb = v.thumbnail.source;
                    var wikiThumbW = v.thumbnail.width;
                    var wikiThumbH = v.thumbnail.height;
                } else {

                    // If no thumbnail data is provided, show a "No Picture" image
                    var wikiThumb = 'img/nopicture.gif';
                }

                // Create an object with current item data
                var wikiObject = {
                    title: wikiTitle,
                    thumbnail: wikiThumb,
                    thumbnailWidth: wikiThumbW,
                    thumbnailHeight: wikiThumbH,
                    url: wikiURL
                }

                // Push created object to wikiArticles observable array
                self.wikiArticles.push(wikiObject);

            });

        }).fail(function() {

            // If API call fails for whatever reason, display an error message to the user
            $('.api-card.wikipedia').html('<div class="api-error"><i class="material-icons">error</i><br>Couldn\'t reach Wikipedia, try again later!</div>');
        });
    };

    // Flickr API manager
    self.getFlickrData = function(lat, long, name) {

        // Flickr sometimes takes a while to load. Let's show a loading gif!
        $('#flickr-load').show();

        // ...and hide the actual gallery markup
        $('#flickr-gallery').hide();

        // Empty flickrPics array
        self.flickrPics().length = 0;

        // URL enconde the city name (without country) for the API request
        var urlEncodedName = encodeURIComponent(name.split(',')[0].trim());

        // API key assigned by flickr
        var flickrAPIkey = '3a36e9a73746f67a89753089747aede3';

        // Construct URL to call flickr's API
        var flickrURL = 'https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=' + flickrAPIkey + '&format=json&nojsoncallback=1&per_page=10&tags=' + urlEncodedName + ',tourist&tag_mode=all';

        // Ajax call to flickr's API
        $.getJSON(flickrURL, function(data) {

            // From the returned JSON, select the array that contains the pictures and store it in a variable
            var flickrItems = data.photos.photo;

            // Loop through the array, create URL's and store them in the flickrPics observable array
            $.each(flickrItems, function(k, v) {

                var photoFarm = v.farm;
                var photoServer = v.server;
                var photoID = v.id;
                var photoSecret = v.secret;
                var photoOwner = v.owner;
                var photoTitle = v.title;

                // Picture source URL
                var photoSrc = 'http://farm' + photoFarm + '.static.flickr.com/' + photoServer + '/' + photoID + '_' + photoSecret + '.jpg';

                // Thumbnail source URL
                var photoThumb = 'http://farm' + photoFarm + '.static.flickr.com/' + photoServer + '/' + photoID + '_' + photoSecret + '_t.jpg';

                // Picture link
                var photoURL = 'http://www.flickr.com/photos/' + photoOwner + '/' + photoID;

                // Create object
                var flickrObject = {
                    src: photoSrc,
                    thumb: photoThumb,
                    subHtml: photoTitle
                }

                // Push object to flickrPics array
                self.flickrPics.push(flickrObject);

            });
        }).fail(function() {

            // If API call fails for whatever reason, display error message
             $('.api-card.flickr').html('<div class="api-error"><i class="material-icons">error</i><br>Couldn\'t reach flickr, try again later!</div>');

        }).always(function() {

            // When the call is completed, hide the loading gif!
            $('#flickr-load').fadeOut(500);

            // ...and 500ms later display the gallery markup
            $('#flickr-gallery').delay(500).fadeIn(500);

            // Create a lightgallery (external script) instance
            $("#flickr-gallery").lightGallery();

        });
    };

    // Script created by another person (can't find the original poster info). It allows to select the first result from autocomplete results when 'Enter' key is pressed.
    (function pacSelectFirst(input){
        // store the original event binding function
        var _addEventListener = (input.addEventListener) ? input.addEventListener : input.attachEvent;

        function addEventListenerWrapper(type, listener) {
        // Simulate a 'down arrow' keypress on hitting 'return' when no pac suggestion is selected,
        // and then trigger the original listener.

        if (type == "keydown") {
          var orig_listener = listener;
          listener = function (event) {
            var suggestion_selected = $(".pac-item-selected").length > 0;
            if (event.which == 13 && !suggestion_selected) {
              var simulated_downarrow = $.Event("keydown", {keyCode:40, which:40})
              orig_listener.apply(input, [simulated_downarrow]);
            }

            orig_listener.apply(input, [event]);
          };
        }

        // add the modified listener
        _addEventListener.apply(input, [type, listener]);
      }

      if (input.addEventListener)
        input.addEventListener = addEventListenerWrapper;
      else if (input.attachEvent)
        input.attachEvent = addEventListenerWrapper;

    })($('#pac-input')[0]);

}

// APPLY BINDINGS AND LET MAGIC HAPPEN!!
ko.applyBindings(new viewModel());

// Jquery magic happens here
var itemsList = $('#locations-list');
var showListButton = $('#show-list-button');

// Function to close items list. Acts differentely depending on viewport size
var closeItemsList = function() {
    if ($(window).width() <= 1024) {
        itemsList.css('left', '-100vw');
    } else {
        itemsList.css('left', '-25vw');
        showListButton.find('i').html('keyboard_arrow_right');
    }
};

// Function to show items list
var showItemsList = function() {
    itemsList.css('left', '0');
    if ($(window).width() <= 1024) {
        showListButton.fadeOut();
    } else {
        showListButton.find('i').html('keyboard_arrow_left');
    }
};

// Shows item list when filter is on focus or a key is pressed on it
$('#locations-filter').on('focus keydown', function() {
    showItemsList();
});

// Shows or hides items list when the button is clicked
$('#show-list-button').on('click', function(){
    if (itemsList.css('left') === '0px') {
        closeItemsList();
    } else {
        showItemsList();
    }
});

// [Mobile] - closes item list when 'Return to map...' is clicked
$('#go-back-bar').on('click', function(){
    $('#locations-list').css('left', '-100vw');
    $('#show-list-button').fadeIn();
});

// Function called to display input allowing new marker addition
var openAddItem = function() {
    $('#add-overlay').show();
    $('#pac-input').val('').focus();
    $('#overlay-close-button').on('click', function(){
        $(this).parent().hide();
    });
};

// Call openAddItem when add button is clicked
$('#add-button').on('click', function(){
    openAddItem();
});

// Close location info window when close button is clicked
$('#location-header i').on('click', function(){
    $('#location-info, #wikipedia-list').fadeOut();
});