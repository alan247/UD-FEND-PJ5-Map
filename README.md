# Visited cities app - Udacity's FEND PJ 5

## Try it!!

If you don't want to read the whole thing, just try the app on Github pages:

[Visited Cities APP] (http://alan247.github.io/UD-FEND-PJ5-Map)

## About

This app was made as part of Udacity's Front End Nanodegree program. It allows to easily create map markers (simulating old style pins on paper maps) to keep track of visited cities on the world. Clicking on a marker will display information and pictures from nearby places (from Wikipedia and flickr API's, respectively).

This app uses localstorage so the created markers will be stored in the user's browser. In this way, the user will be able to update their map in the future.

Knockout.js was used for most of the javascript magic, but many other cool things were used as well, like:

1. Foundation
1. Gulp
1. jQuery
1. Bower
1. Lightgallery

API's used:

1. Google Maps API
1. Wikimedia API
1. Flickr API
1. Custom made API

## Download and run locally

You can run this app locally. Just download the repository, and open `index.html` from `dist` directory.

If you make any changes, you should run gulp to update the `dist` directory content. To do this, make sure you have [npm] (https://www.npmjs.com/) installed in your system and follow these steps:

1. Open Terminal (on Mac) and find the directory where you saved this repository
1. Run npm's install command `npm install`. This will install the dependencies found on `package.json` and needed to create the app (including gulp)
1. Once npm has finished, run `bower install`. This will install all bower dependencies found on `bower.json` file (including jQuery, foundation and lightgallery)
1. At this point you are ready to run gulp. Just type `gulp` and wait for it to finish. The `dist` directory will update itself and a new browser window will open automatically (thanks to browser sync!!). From this moment, until you close or finish the gulp process, any changes you make in the `src` directory will immediately cause an update on  `dist` and you will see your changes appear immediately on the browser without having to reload.

Have fun improving, destroying or just playing around with my app.



