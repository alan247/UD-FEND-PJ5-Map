var viewModel = function() {
    var self = this;
    self.infoWindow = new google.maps.InfoWindow();
    self.wikiArticles = ko.observableArray();
    self.flickrPics = ko.observableArray();
    self.filter = ko.observable('');
    self.currentCityCountry = ko.observable();
    self.currentCity = ko.observable();
    self.currentLocationData = ko.observable('Loading...');
    self.currentOpenedMarker;
    var markersFinalArray = ko.observableArray([]);
    var infoWindowHTML = $('#info-window');

    // Google maps init
    var map = new google.maps.Map(document.getElementById('map'), {
        center: new google.maps.LatLng(40.8333467, -48.1009912),
        zoom: 2,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        zoomControl: false,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_TOP
        }
    });

    // Init GMaps geocoder
    var geocoder = new google.maps.Geocoder();

    // Init GMaps autocomplete
    var autocomplete = new google.maps.places.Autocomplete(document.getElementById('pac-input'), {
        bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(-90, -180),
            new google.maps.LatLng(90, 180)),
        types: ['(cities)']
    });

    // Creates a marker with the geocoded user info
    function geocodeInput() {

        // Get autocomplete result by checking the value of the input
        var address = $('#pac-input').val();

        // Pass the value to Google Maps' geocode method
        geocoder.geocode( { 'address': address}, function(results, status) {

            // If geocode request is succesful
            if (status == google.maps.GeocoderStatus.OK) {

                // Re-center map to the new location
                map.setCenter(results[0].geometry.location);

                // Extract name and coordinates from geocode results
                cityName = results[0].formatted_address;

                // Geocode returns a LatLng object, so in order to get the lat and long, we need to use lat() and lng() methods
                cityLat = results[0].geometry.location.lat();
                cityLong = results[0].geometry.location.lng();

                // Call our marker creator with the new marker's info
                new createMarker(cityName, cityLat, cityLong, true);

                // Store the locations marker in localstorage
                self.storeLocally();


            } else {
            alert("Geocode was not successful for the following reason: " + status);
          }
        });
    }

    // Local storage management
    self.storeLocally = function(){

        // Create a new array with markersFinalArray() data. For each item we need: lat, lng and name. We leave out the marker. This is necessary because JSON.stringify cannot do its job in an array that contains objects containing GMaps markers

        var markers = markersFinalArray();

        var storeArray = [];

        $.each(markers, function(k, v) {


            markerObject = {
                name: v.name,
                lat: v.lat,
                long: v.long,
                userCreated: v.userCreated
            }

            storeArray.push(markerObject);

        });


        localStorage.setItem('userLocalData', JSON.stringify(storeArray));


    };


    // Listens for 'enter' key. Hides the overlay and calls geocodeInput
    $('#pac-input').keyup(function (e) {
        if (e.keyCode == 13) {
             $('#add-overlay').hide();
            geocodeInput();
        }
    });

    // Markers processing function
    var createMarker = function(name, lat, long, userCreated) {



        // Create marker with given data and add it to the final markers array
        markersFinalArray.push({
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

        // Add click listener to the fresly created marker
        var maLength = markersFinalArray().length;
        var maLast = markersFinalArray()[maLength - 1];
        var maItem = maLast.marker;
        var maName = maLast.name;
        var maLat = maLast.lat;
        var maLong = maLast.long;

        maItem.addListener('click', function() {
            self.clickOnItem(maName, maItem, maLat, maLong, userCreated);
        });
    };

    // Delete Marker
    self.deleteMarker = function(clickedItem){
        var name = clickedItem.name;
        for (var key in markersFinalArray()) {
            if (name === markersFinalArray()[key].name) {
                markersFinalArray()[key].marker.setMap(null);
                markersFinalArray().splice(key, 1);
                markersFinalArray(markersFinalArray());


                self.storeLocally();
            }
        //map.setZoom(3);
        }
    };


    // Initial markers:
    // Check if there's any local storage with data from previous sessions and load it. Otherwise, load default markers.
    //
    // TO-DO: initial markers are set depending on user location

    if (localStorage.getItem('userLocalData') !== null) {

       var storedData = JSON.parse(localStorage.getItem('userLocalData'));

       $.each(storedData, function(k, v) {
            var lat = v.lat;
            var long = v.long;
            var name = v.name;
            var userCreated = v.userCreated;


           new createMarker(name, lat, long, userCreated);
        });


    } else {

        // Get Initial locations from the server I set up for this purpose

        var initialLocationsURL = 'http://paperbac.pairserver.com/locations.php';

        $.getJSON(initialLocationsURL, function(data) {

            var locations = data.locations;

            $.each(locations, function(k, v) {
                var cityCountry = v.city + ', ' + v.country;
                var latitude = v.latitude;
                var longitude = v.longitude;

                new createMarker(cityCountry, latitude, longitude, false);
            });

            self.infoWindow.setContent(infoWindowHTML[0]);

        }).fail(function() {
            console.log('fail ajax');
            alert('Could not load sample markers from the server, but feel free to add your own!');
        });
    }


    // Process click on a marker or list item
    self.clickOnItem = function(name, marker, lat, long, userCreated) {

        $("body").append(infoWindowHTML);

        $('.list-container ul li').each(function(){

            var thisName = $(this).children('.list-item').html();

            if(name === thisName) {
                $(this).addClass('selected').siblings().removeClass('selected');
            }

        });

        // Close currently opened infowindows
        self.closeInfoWindows();

        var splitCity = name.split(',');

        self.currentCity(splitCity[0]);
        self.currentCityCountry(name);
        self.currentLocationData(name+'|'+userCreated);



        if ($(window).width() <= 1024) {
            $('#locations-list').delay(500).css('left', '0');
            $('#show-list-button').hide();
            $('#info-window').show();
        } else {
            $('#infow-window').fadeIn();
        }


        $('#location-info').show();

        var icon;
        var userSelectedIcon = 'http://maps.google.com/mapfiles/kml/paddle/blu-stars.png';
        var defaultSelectedIcon = 'http://maps.google.com/mapfiles/kml/paddle/red-stars.png'

        if(userCreated){
            icon = userSelectedIcon;
        } else {
            icon = defaultSelectedIcon;
        }

        marker.setIcon(icon);


        marker.setAnimation(google.maps.Animation.BOUNCE);

        setTimeout(function() {
            marker.setAnimation(null);
            //self.infoWindow.open(map, marker);
        }, 750);
        var coords = new google.maps.LatLng(lat, long);

        map.panTo(coords);
        map.setZoom(5);

        var windowWidth = $(window).width();

        // Check viewport size. If it's bigger than 1024, pan the map accordingly.
        if ($(window).width() <= 1024) {
            map.panBy(0, -210);
        } else {
            var calculatedCenter = windowWidth * .5 / 2;
            map.panBy(-(calculatedCenter), -210);
        }

        var apiCoords = lat + '|' + long;


        self.getWikiData(apiCoords, marker);
        self.getFlickrData(lat, long, name);

        if ($('#flickr-gallery').data('lightGallery') != null) {
            $('#flickr-gallery').data('lightGallery').destroy(true);
        }



    };

    // Function accesed from the VIEW. Uses the name from the clicked item on the list and calls clickOnItem() with its data.
    self.goToMarker = function(clickedItem) {
        var markerName = clickedItem.name;
        for (var key in markersFinalArray()) {
            if (markerName === markersFinalArray()[key].name) {
                var marker = markersFinalArray()[key].marker;
                var markerLat = markersFinalArray()[key].lat;
                var markerLong = markersFinalArray()[key].long;
                var userCreated = markersFinalArray()[key].userCreated;


                self.clickOnItem(markerName, marker, markerLat, markerLong, userCreated);
                //self.filter(markerName); // Sets filter to cu
                setTimeout(function() {
                    //self.infoWindow.open(map, marker);
                }, 750);
            }
        }
    };

    // Clears the filter input and re-centers the map
    self.clearMap = function() {
        self.filter('');
        var coords = new google.maps.LatLng(40.8333467, -48.1009912);
        map.panTo(coords);
        map.setZoom(2);
        self.closeInfoWindows();
        $('#info-window').hide();
        $('body').append(infoWindowHTML);
    };

    // Change Icon
    self.closeInfoWindows = function() {


        var currentData = self.currentLocationData().split('|');

        var markerName = currentData[0];
        var userCreated = currentData[1];


        for (var key in markersFinalArray()) {
            if (markerName === markersFinalArray()[key].name) {
                var marker = markersFinalArray()[key].marker;

                if(userCreated === 'true') {
                    marker.setIcon('http://maps.google.com/mapfiles/ms/micons/blue.png');
                } else {
                    marker.setIcon('http://maps.google.com/mapfiles/ms/micons/red.png');
                }

                // Check if it is user created
                // Assing icon to variable
                // Set icon to marker


            }
        }




        self.infoWindow.close();
    };

    google.maps.event.addListener(self.infoWindow, 'closeclick', function() {
        self.clearMap();
    });

    // Closes infowindows when the map is clicked
    google.maps.event.addListener(map, "click", function(event) {
        var map = self.infoWindow.getMap();

        // Only act if an infowindow is open
        if (map !== null && typeof map !== 'undefined') {
            self.clearMap();
        }
    });

        // The filtering happens here
    self.filteredItems = ko.computed(function() {

        // // Close any currently open infowindow
        self.closeInfoWindows();


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
                    if (markerName.search(filter) >= 0) {
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

    // Manage listener on 'esc' key. Closes overlay or clears map depending on context
    // $(document).keyup(function (e) {
    //     if (e.keyCode == 27) {
    //         if($('#add-overlay').is(':visible')) {
    //             $('#add-overlay').hide();
    //         } else {
    //             self.clearMap();
    //             self.deleteMarker(clickedItem);
    //         }
    //     }
    // });




    self.getWikiData = function(coords, marker) {

        // Empty wikiArticles array
        self.wikiArticles().length = 0;

        // Define wiki api url
        var wikiURL = 'https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages%7Cinfo&list=&generator=geosearch&piprop=thumbnail&pithumbsize=80&pilimit=4&inprop=url&ggscoord=' + coords + '&ggsradius=10000&ggslimit=4&callback=?';


        $.getJSON(wikiURL, function(data) {


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
                    title: wikiTitle,
                    thumbnail: wikiThumb,
                    thumbnailWidth: wikiThumbW,
                    thumbnailHeight: wikiThumbH,
                    url: wikiURL
                }

                self.wikiArticles.push(wikiObject);

            });


            self.infoWindow.setContent(infoWindowHTML[0]);

        }).fail(function() {
            $('.api-card.wikipedia').html('<div class="api-error"><i class="material-icons">error</i><br>Couldn\'t reach Wikipedia, try again later!</div>');
        });


    };


    self.getFlickrData = function(lat, long, name) {

        // Flickr sometimes takes a while to load. Let's show a loading gif!
        $('#flickr-gallery').hide();
        $('#flickr-load').show();


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

                var photoSrc = 'http://farm' + photoFarm + '.static.flickr.com/' + photoServer + '/' + photoID + '_' + photoSecret + '.jpg';

                var photoThumb = 'http://farm' + photoFarm + '.static.flickr.com/' + photoServer + '/' + photoID + '_' + photoSecret + '_t.jpg';

                var photoURL = 'http://www.flickr.com/photos/' + photoOwner + '/' + photoID;

                var flickrObject = {
                    src: photoSrc,
                    thumb: photoThumb,
                    subHtml: photoTitle
                }

                self.flickrPics.push(flickrObject);

            });
        }).fail(function() {
            console.log('fail ajax');
             $('.api-card.flickr').html('<div class="api-error"><i class="material-icons">error</i><br>Couldn\'t reach flickr, try again later!</div>');
        }).always(function() {

            // When the call is completed, hide the loading gif!

            $('#flickr-load').fadeOut(500);
            $('#flickr-gallery').delay(500).fadeIn(500);


            $("#flickr-gallery").lightGallery({
            });

            $('#flickr-gallery').on('onCloseAfter.lg',function(event){

              //  $('#flickr-gallery').data('lightGallery').destroy(true);

            });
        });

    };




// If you created your Autocomplete with some options, like var autocompleteOptions = { componentRestrictions: { country: 'fr'}};, don't forget to re-add these options in the last line of the @amirnissim answer, as var autocomplete = new google.maps.places.Autocomplete(input, autocompleteOptions); I just have this problem and lost 1/2 hour on it. BTW, thanks for this very nice answer


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

// Necessary to keep jQuery working
ko.bindingHandlers.listClick = {
    // init: function(element) {
    //     $(element).on('click', function() {
    //         $(this).siblings().removeClass('selected');
    //         $(this).addClass('selected');
    //         if ($(window).width() <= 1024) {
    //             $('.toggle-controls, .overlay, .list').toggle();
    //         }
    //     });
    // }
};

ko.applyBindings(new viewModel());




  var itemsList = $('#locations-list');
    var showListButton = $('#show-list-button');

    var closeItemsList = function() {
        if ($(window).width() <= 1024) {
            itemsList.css('left', '-100vw');
        } else {
            itemsList.css('left', '-25vw');
            showListButton.find('i').html('keyboard_arrow_right');
        }
    };

    var showItemsList = function() {
        itemsList.css('left', '0');
        if ($(window).width() <= 1024) {
            showListButton.fadeOut();
        } else {
            showListButton.find('i').html('keyboard_arrow_left');
        }
    };

    $('#locations-filter').on('focus keydown', function() {
        showItemsList();
    });

    $('#show-list-button').on('click', function(){
        if (itemsList.css('left') === '0px') {
            closeItemsList();
        } else {
            showItemsList();
        }
    });






        $('#go-back-bar').on('click', function(){
            $('#locations-list').css('left', '-100vw');
            $('#show-list-button').fadeIn();

        });


        var openAddItem = function() {

            $('#add-overlay').show();
            $('#pac-input').val('').focus();
            $('#overlay-close-button').on('click', function(){
                $(this).parent().hide();
            });

        };

        $('#add-button').on('click', function(){
            openAddItem();
        });

        $('.delete-item').on('click', function(){
            console.log('delete item');
        });


        $('#location-header i').on('click', function(){

            // if ($(window).width() <= 1024) {
            //     $('#locations-list').css('left', '-100vw');
            // } else {
                $('#location-info, #wikipedia-list').fadeOut();
            //}
        });

        $('.action').on('click', function(){
            $('#wikipedia-list').fadeIn();
        });

        $('.close-wikipedia i').on('click', function(){
            $('#wikipedia-list').fadeOut();
        });




