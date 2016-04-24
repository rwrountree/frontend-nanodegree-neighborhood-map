/**
 * Created by Rusty on 4/19/2016.
 */

'use strict';

/**
 * Constructor function for the map application
 * @constructor
 */
function MapApp() { // eslint-disable-line no-unused-vars
  var self = this;
  self.window = null;
  self.document = null;
  self.map = null;
  self.bounds = new google.maps.LatLngBounds();
  self.venues = ko.observableArray();
  self.currentVenue = ko.observable();
  self.markers = [];
  self.infoWindow = null;
  self.ironAjax = null;
  self.filterQuery = ko.observable('');
  self.filterQuery.subscribe(filterVenues);

  /**
   * Filter venue list view
   */
  function filterVenues() {
    var venueName;
    var search = self.filterQuery().toLowerCase();

    self.venues().forEach(function (venue) {
      venueName = venue.name.toLowerCase();

      if (venueName.indexOf(search) >= 0) {
        venue.visible(true);
        venue.marker.setMap(self.map);
      } else {
        venue.visible(false);
        venue.marker.setMap(null);
      }
    });
  }

  /**
   * Initialize the google map
   * @param {object} elementId - HTML element to attach the map to
   */
  function initializeMap(elementId) {
    self.map = new google.maps.Map(self.document.getElementById(elementId), {
      disableDefaultUI: true,
      zoom: 11
    });

    // create info window used for all map markers
    self.infoWindow = new google.maps.InfoWindow({map: self.map});
    self.infoWindow.close();
  }

  /**
   * Select a venue, and update its map marker and info window
   * @param {Venue} selectedVenue - the venue that has been selected
   */
  self.selectVenue = function (selectedVenue) {
    var index;
    var venue;
    var numberOfVenues = self.venues().length;

    // check if the selected venue is already selected
    if (selectedVenue === self.currentVenue) {
      // if it is, make sure info window is open
      if (isInfoWindowOpen()) {
        updateInfoWindow(selectedVenue.marker, selectedVenue.content);
      }

      return;
    }

    self.currentVenue(selectedVenue);

    // traverse venues
    for (index = 0; index < numberOfVenues; index++) {
      venue = self.venues()[index];

      // when the selected venue is found...
      if (self.currentVenue() === venue) {
        // stop all marker animations except this one
        clearMapMarkerAnimations(venue.marker);

        // toggle bounce animation on marker if necessary
        if (venue.marker.getAnimation() !== google.maps.Animation.BOUNCE) {
          toggleBounce(venue.marker);
        }

        // update info window content
        updateInfoWindow(venue.marker, venue.content);

        // bail out since we're done
        break;
      }
    }
  };

  /**
   * Detect if info window is open
   * @return {boolean} - is info window open
   */
  function isInfoWindowOpen() {
    var map = self.infoWindow.getMap();
    return (map !== null && typeof map !== 'undefined');
  }

  /**
   * Update info window's content
   * @param {google.maps.Marker} marker - the map marker to set the info window on
   * @param {string} info - content for the info window
   */
  function updateInfoWindow(marker, info) {
    self.infoWindow.setContent(info);
    // make sure info window is open
    self.infoWindow.open(self.map, marker);
  }

  /**
   * Toggle bouncing animation for a marker
   * @param {Marker} marker - the marker to enable/disable bounce animation
   */
  function toggleBounce(marker) {
    if (marker.getAnimation() === null) {
      // enable marker animation if it wasn't running
      marker.setAnimation(google.maps.Animation.BOUNCE);
    } else {
      // disable marker animation if it was running
      marker.setAnimation(null);
    }
  }

  /**
   * Stop marker animations
   * @param {google.maps.Marker} exceptThisMarker - optional marker to exclude
   */
  function clearMapMarkerAnimations(exceptThisMarker) {
    // clear all marker animations except for the marker (optional) passed in
    self.markers.forEach(function (marker) {
      if (exceptThisMarker !== marker) {
        marker.setAnimation(null);
      }
    });
  }

  /**
   * Add map marker at venue's location on the map
   * @param {object} venue - venue for the map marker
   * @return {google.maps.Marker} - newly created map marker
   */
  function addMapMarker(venue) {
    // create a new marker with specified options
    var marker = new google.maps.Marker({
      position: venue.location,
      map: self.map,
      title: venue.name,
      draggable: false,
      animation: google.maps.Animation.DROP
    });

    // expand map boundaries to contain new marker
    self.bounds.extend(marker.position);
    self.map.fitBounds(self.bounds);

    // add a click event listener to the marker that triggers venue selection
    google.maps.event.addListener(marker, 'click', function () { // eslint-disable-line no-loop-func
      self.selectVenue(venue);
    });

    // add marker to the markers array
    self.markers.push(marker);

    // return new marker
    return marker;
  }

  /**
   * Check if venue is currently selected
   * @param {object} venue - the venue in question
   * @return {boolean} - true/false if venue is selected
   */
  self.isSelected = function (venue) {
    return (self.currentVenue() === venue);
  };

  /**
   * Venue constructor function
   * @param {object} venue - data element from the venues array returned from ironAjax request
   * @constructor
   */
  function Venue(venue) {
    var self = this;

    self.location = {lat: venue.location.lat, lng: venue.location.lng};
    self.name = venue.name;
    // content for info window
    self.content =
      // name of place
      '<strong>%name</strong>'.replace(/%name/g, venue.name) +
      '<br>' +
      // if the venue's url or address was retrieve from Foursquare, display 'Foursquare Info:'
      ((venue.url !== undefined || venue.location.formattedAddress !== undefined) ? 'Foursquare Info:<br>' : '') +
      // build the html for venue's web address, if available
      (venue.url === undefined ? '' : '<a href="%url">%url</a><br>'.replace(/%url/g, venue.url)) +
      // build the html for venue's physical address, if available
      (venue.location.formattedAddress === undefined ? '' : venue.location.formattedAddress.join('<br>'));
    self.marker = addMapMarker(self);
    self.visible = ko.observable(true);
  }

  /**
   * Foursquare request configuration
   * @type {{url: string, params: {client_id: string, client_secret: string, v: string, ll: string, query: string, limit: string}}}
   */
  var foursquareRequestConfig = {
    url: 'https://api.foursquare.com/v2/venues/search',
    params: { // eslint-disable-line quote-props
      'client_id': 'DM04OKNQOAEBGPW5UNEZCM2SG2JKZM4NYPO5FX1GN4G15BT0',
      'client_secret': 'DMODPKCJKQ2YQTNSBR2AQEENVUT30M2RMFSXSZI5YGPB5LNF',
      'v': '20130815',
      'll': '40.6249522,-73.96150369999999',
      'query': 'pizza',
      'limit': '20'
    }
  };

  /**
   * Initialize the app
   * @param {object} elementId - HTML element for the map
   * @param {object} window - the global window object
   * @param {object} document - the global document object
   * @param {object} ironAjax - iron-ajax Polymer element used for ajax requests
   */
  self.initialize = function (elementId, window, document, ironAjax) {
    self.window = window;
    self.document = document;
    self.ironAjax = ironAjax;

    // self.ironAjax.addEventListener('request', function (e) { // eslint-disable-line no-unused-vars
    //   self.ironAjax.lastResponse.response.venues;
    // });

    // add response listener for iron ajax requests
    self.ironAjax.addEventListener('response', function (e) { // eslint-disable-line no-unused-vars
      var responseVenues = self.ironAjax.lastResponse.response.venues;

      // create new Venue objects for the venues array based on the venues data from the request
      responseVenues.forEach(function (venue) {
        self.venues.push(new Venue(venue));
      });

      // the array is built, now center the map to center of bounds
      if (responseVenues.length) {
        self.map.setCenter(self.bounds.getCenter());
      }
    });

    // add error listener for iron ajax requests
    self.ironAjax.addEventListener('error', function (e) { // eslint-disable-line no-unused-vars
      self.window.alert(
        'Foursquare data could not be retrieved.' +
        '\nStatus: ' +
        e.detail.request.status +
        '\nStatus Text: ' +
        e.detail.request.statusText
      );
    });

    // conifgure ironAjax to use predefine Foursquare request
    ironAjax.url = foursquareRequestConfig.url;
    ironAjax.params = foursquareRequestConfig.params;

    // execute an ajax request
    self.ironAjax.generateRequest();

    // initialize map on specified HTML element
    initializeMap(elementId);

    // apply knockout bindings
    ko.applyBindings(self);
  };
}
