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
    self.content =
      venue.name +
      '<br>' +
      (venue.url === undefined ? '' : '<a href="%url">%url</a><br>'.replace(/%url/g, venue.url)) +
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJhcHAuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IFJ1c3R5IG9uIDQvMTkvMjAxNi5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQ29uc3RydWN0b3IgZnVuY3Rpb24gZm9yIHRoZSBtYXAgYXBwbGljYXRpb25cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBNYXBBcHAoKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBzZWxmLndpbmRvdyA9IG51bGw7XG4gIHNlbGYuZG9jdW1lbnQgPSBudWxsO1xuICBzZWxmLm1hcCA9IG51bGw7XG4gIHNlbGYuYm91bmRzID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZ0JvdW5kcygpO1xuICBzZWxmLnZlbnVlcyA9IGtvLm9ic2VydmFibGVBcnJheSgpO1xuICBzZWxmLmN1cnJlbnRWZW51ZSA9IGtvLm9ic2VydmFibGUoKTtcbiAgc2VsZi5tYXJrZXJzID0gW107XG4gIHNlbGYuaW5mb1dpbmRvdyA9IG51bGw7XG4gIHNlbGYuaXJvbkFqYXggPSBudWxsO1xuICBzZWxmLmZpbHRlclF1ZXJ5ID0ga28ub2JzZXJ2YWJsZSgnJyk7XG4gIHNlbGYuZmlsdGVyUXVlcnkuc3Vic2NyaWJlKGZpbHRlclZlbnVlcyk7XG5cbiAgLyoqXG4gICAqIEZpbHRlciB2ZW51ZSBsaXN0IHZpZXdcbiAgICovXG4gIGZ1bmN0aW9uIGZpbHRlclZlbnVlcygpIHtcbiAgICB2YXIgdmVudWVOYW1lO1xuICAgIHZhciBzZWFyY2ggPSBzZWxmLmZpbHRlclF1ZXJ5KCkudG9Mb3dlckNhc2UoKTtcblxuICAgIHNlbGYudmVudWVzKCkuZm9yRWFjaChmdW5jdGlvbiAodmVudWUpIHtcbiAgICAgIHZlbnVlTmFtZSA9IHZlbnVlLm5hbWUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgaWYgKHZlbnVlTmFtZS5pbmRleE9mKHNlYXJjaCkgPj0gMCkge1xuICAgICAgICB2ZW51ZS52aXNpYmxlKHRydWUpO1xuICAgICAgICB2ZW51ZS5tYXJrZXIuc2V0TWFwKHNlbGYubWFwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZlbnVlLnZpc2libGUoZmFsc2UpO1xuICAgICAgICB2ZW51ZS5tYXJrZXIuc2V0TWFwKG51bGwpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgdGhlIGdvb2dsZSBtYXBcbiAgICogQHBhcmFtIHtvYmplY3R9IGVsZW1lbnRJZCAtIEhUTUwgZWxlbWVudCB0byBhdHRhY2ggdGhlIG1hcCB0b1xuICAgKi9cbiAgZnVuY3Rpb24gaW5pdGlhbGl6ZU1hcChlbGVtZW50SWQpIHtcbiAgICBzZWxmLm1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAoc2VsZi5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChlbGVtZW50SWQpLCB7XG4gICAgICBkaXNhYmxlRGVmYXVsdFVJOiB0cnVlLFxuICAgICAgem9vbTogMTFcbiAgICB9KTtcblxuICAgIC8vIGNyZWF0ZSBpbmZvIHdpbmRvdyB1c2VkIGZvciBhbGwgbWFwIG1hcmtlcnNcbiAgICBzZWxmLmluZm9XaW5kb3cgPSBuZXcgZ29vZ2xlLm1hcHMuSW5mb1dpbmRvdyh7bWFwOiBzZWxmLm1hcH0pO1xuICAgIHNlbGYuaW5mb1dpbmRvdy5jbG9zZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbGVjdCBhIHZlbnVlLCBhbmQgdXBkYXRlIGl0cyBtYXAgbWFya2VyIGFuZCBpbmZvIHdpbmRvd1xuICAgKiBAcGFyYW0ge1ZlbnVlfSBzZWxlY3RlZFZlbnVlIC0gdGhlIHZlbnVlIHRoYXQgaGFzIGJlZW4gc2VsZWN0ZWRcbiAgICovXG4gIHNlbGYuc2VsZWN0VmVudWUgPSBmdW5jdGlvbiAoc2VsZWN0ZWRWZW51ZSkge1xuICAgIHZhciBpbmRleDtcbiAgICB2YXIgdmVudWU7XG4gICAgdmFyIG51bWJlck9mVmVudWVzID0gc2VsZi52ZW51ZXMoKS5sZW5ndGg7XG5cbiAgICAvLyBjaGVjayBpZiB0aGUgc2VsZWN0ZWQgdmVudWUgaXMgYWxyZWFkeSBzZWxlY3RlZFxuICAgIGlmIChzZWxlY3RlZFZlbnVlID09PSBzZWxmLmN1cnJlbnRWZW51ZSkge1xuICAgICAgLy8gaWYgaXQgaXMsIG1ha2Ugc3VyZSBpbmZvIHdpbmRvdyBpcyBvcGVuXG4gICAgICBpZiAoaXNJbmZvV2luZG93T3BlbigpKSB7XG4gICAgICAgIHVwZGF0ZUluZm9XaW5kb3coc2VsZWN0ZWRWZW51ZS5tYXJrZXIsIHNlbGVjdGVkVmVudWUuY29udGVudCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZWxmLmN1cnJlbnRWZW51ZShzZWxlY3RlZFZlbnVlKTtcblxuICAgIC8vIHRyYXZlcnNlIHZlbnVlc1xuICAgIGZvciAoaW5kZXggPSAwOyBpbmRleCA8IG51bWJlck9mVmVudWVzOyBpbmRleCsrKSB7XG4gICAgICB2ZW51ZSA9IHNlbGYudmVudWVzKClbaW5kZXhdO1xuXG4gICAgICAvLyB3aGVuIHRoZSBzZWxlY3RlZCB2ZW51ZSBpcyBmb3VuZC4uLlxuICAgICAgaWYgKHNlbGYuY3VycmVudFZlbnVlKCkgPT09IHZlbnVlKSB7XG4gICAgICAgIC8vIHN0b3AgYWxsIG1hcmtlciBhbmltYXRpb25zIGV4Y2VwdCB0aGlzIG9uZVxuICAgICAgICBjbGVhck1hcE1hcmtlckFuaW1hdGlvbnModmVudWUubWFya2VyKTtcblxuICAgICAgICAvLyB0b2dnbGUgYm91bmNlIGFuaW1hdGlvbiBvbiBtYXJrZXIgaWYgbmVjZXNzYXJ5XG4gICAgICAgIGlmICh2ZW51ZS5tYXJrZXIuZ2V0QW5pbWF0aW9uKCkgIT09IGdvb2dsZS5tYXBzLkFuaW1hdGlvbi5CT1VOQ0UpIHtcbiAgICAgICAgICB0b2dnbGVCb3VuY2UodmVudWUubWFya2VyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHVwZGF0ZSBpbmZvIHdpbmRvdyBjb250ZW50XG4gICAgICAgIHVwZGF0ZUluZm9XaW5kb3codmVudWUubWFya2VyLCB2ZW51ZS5jb250ZW50KTtcblxuICAgICAgICAvLyBiYWlsIG91dCBzaW5jZSB3ZSdyZSBkb25lXG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogRGV0ZWN0IGlmIGluZm8gd2luZG93IGlzIG9wZW5cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gLSBpcyBpbmZvIHdpbmRvdyBvcGVuXG4gICAqL1xuICBmdW5jdGlvbiBpc0luZm9XaW5kb3dPcGVuKCkge1xuICAgIHZhciBtYXAgPSBzZWxmLmluZm9XaW5kb3cuZ2V0TWFwKCk7XG4gICAgcmV0dXJuIChtYXAgIT09IG51bGwgJiYgdHlwZW9mIG1hcCAhPT0gJ3VuZGVmaW5lZCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBpbmZvIHdpbmRvdydzIGNvbnRlbnRcbiAgICogQHBhcmFtIHtnb29nbGUubWFwcy5NYXJrZXJ9IG1hcmtlciAtIHRoZSBtYXAgbWFya2VyIHRvIHNldCB0aGUgaW5mbyB3aW5kb3cgb25cbiAgICogQHBhcmFtIHtzdHJpbmd9IGluZm8gLSBjb250ZW50IGZvciB0aGUgaW5mbyB3aW5kb3dcbiAgICovXG4gIGZ1bmN0aW9uIHVwZGF0ZUluZm9XaW5kb3cobWFya2VyLCBpbmZvKSB7XG4gICAgc2VsZi5pbmZvV2luZG93LnNldENvbnRlbnQoaW5mbyk7XG4gICAgLy8gbWFrZSBzdXJlIGluZm8gd2luZG93IGlzIG9wZW5cbiAgICBzZWxmLmluZm9XaW5kb3cub3BlbihzZWxmLm1hcCwgbWFya2VyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGUgYm91bmNpbmcgYW5pbWF0aW9uIGZvciBhIG1hcmtlclxuICAgKiBAcGFyYW0ge01hcmtlcn0gbWFya2VyIC0gdGhlIG1hcmtlciB0byBlbmFibGUvZGlzYWJsZSBib3VuY2UgYW5pbWF0aW9uXG4gICAqL1xuICBmdW5jdGlvbiB0b2dnbGVCb3VuY2UobWFya2VyKSB7XG4gICAgaWYgKG1hcmtlci5nZXRBbmltYXRpb24oKSA9PT0gbnVsbCkge1xuICAgICAgLy8gZW5hYmxlIG1hcmtlciBhbmltYXRpb24gaWYgaXQgd2Fzbid0IHJ1bm5pbmdcbiAgICAgIG1hcmtlci5zZXRBbmltYXRpb24oZ29vZ2xlLm1hcHMuQW5pbWF0aW9uLkJPVU5DRSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGRpc2FibGUgbWFya2VyIGFuaW1hdGlvbiBpZiBpdCB3YXMgcnVubmluZ1xuICAgICAgbWFya2VyLnNldEFuaW1hdGlvbihudWxsKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU3RvcCBtYXJrZXIgYW5pbWF0aW9uc1xuICAgKiBAcGFyYW0ge2dvb2dsZS5tYXBzLk1hcmtlcn0gZXhjZXB0VGhpc01hcmtlciAtIG9wdGlvbmFsIG1hcmtlciB0byBleGNsdWRlXG4gICAqL1xuICBmdW5jdGlvbiBjbGVhck1hcE1hcmtlckFuaW1hdGlvbnMoZXhjZXB0VGhpc01hcmtlcikge1xuICAgIC8vIGNsZWFyIGFsbCBtYXJrZXIgYW5pbWF0aW9ucyBleGNlcHQgZm9yIHRoZSBtYXJrZXIgKG9wdGlvbmFsKSBwYXNzZWQgaW5cbiAgICBzZWxmLm1hcmtlcnMuZm9yRWFjaChmdW5jdGlvbiAobWFya2VyKSB7XG4gICAgICBpZiAoZXhjZXB0VGhpc01hcmtlciAhPT0gbWFya2VyKSB7XG4gICAgICAgIG1hcmtlci5zZXRBbmltYXRpb24obnVsbCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkIG1hcCBtYXJrZXIgYXQgdmVudWUncyBsb2NhdGlvbiBvbiB0aGUgbWFwXG4gICAqIEBwYXJhbSB7b2JqZWN0fSB2ZW51ZSAtIHZlbnVlIGZvciB0aGUgbWFwIG1hcmtlclxuICAgKiBAcmV0dXJuIHtnb29nbGUubWFwcy5NYXJrZXJ9IC0gbmV3bHkgY3JlYXRlZCBtYXAgbWFya2VyXG4gICAqL1xuICBmdW5jdGlvbiBhZGRNYXBNYXJrZXIodmVudWUpIHtcbiAgICAvLyBjcmVhdGUgYSBuZXcgbWFya2VyIHdpdGggc3BlY2lmaWVkIG9wdGlvbnNcbiAgICB2YXIgbWFya2VyID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlcih7XG4gICAgICBwb3NpdGlvbjogdmVudWUubG9jYXRpb24sXG4gICAgICBtYXA6IHNlbGYubWFwLFxuICAgICAgdGl0bGU6IHZlbnVlLm5hbWUsXG4gICAgICBkcmFnZ2FibGU6IGZhbHNlLFxuICAgICAgYW5pbWF0aW9uOiBnb29nbGUubWFwcy5BbmltYXRpb24uRFJPUFxuICAgIH0pO1xuXG4gICAgLy8gZXhwYW5kIG1hcCBib3VuZGFyaWVzIHRvIGNvbnRhaW4gbmV3IG1hcmtlclxuICAgIHNlbGYuYm91bmRzLmV4dGVuZChtYXJrZXIucG9zaXRpb24pO1xuICAgIHNlbGYubWFwLmZpdEJvdW5kcyhzZWxmLmJvdW5kcyk7XG5cbiAgICAvLyBhZGQgYSBjbGljayBldmVudCBsaXN0ZW5lciB0byB0aGUgbWFya2VyIHRoYXQgdHJpZ2dlcnMgdmVudWUgc2VsZWN0aW9uXG4gICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFya2VyLCAnY2xpY2snLCBmdW5jdGlvbiAoKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbG9vcC1mdW5jXG4gICAgICBzZWxmLnNlbGVjdFZlbnVlKHZlbnVlKTtcbiAgICB9KTtcblxuICAgIC8vIGFkZCBtYXJrZXIgdG8gdGhlIG1hcmtlcnMgYXJyYXlcbiAgICBzZWxmLm1hcmtlcnMucHVzaChtYXJrZXIpO1xuXG4gICAgLy8gcmV0dXJuIG5ldyBtYXJrZXJcbiAgICByZXR1cm4gbWFya2VyO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHZlbnVlIGlzIGN1cnJlbnRseSBzZWxlY3RlZFxuICAgKiBAcGFyYW0ge29iamVjdH0gdmVudWUgLSB0aGUgdmVudWUgaW4gcXVlc3Rpb25cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gLSB0cnVlL2ZhbHNlIGlmIHZlbnVlIGlzIHNlbGVjdGVkXG4gICAqL1xuICBzZWxmLmlzU2VsZWN0ZWQgPSBmdW5jdGlvbiAodmVudWUpIHtcbiAgICByZXR1cm4gKHNlbGYuY3VycmVudFZlbnVlKCkgPT09IHZlbnVlKTtcbiAgfTtcblxuICAvKipcbiAgICogVmVudWUgY29uc3RydWN0b3IgZnVuY3Rpb25cbiAgICogQHBhcmFtIHtvYmplY3R9IHZlbnVlIC0gZGF0YSBlbGVtZW50IGZyb20gdGhlIHZlbnVlcyBhcnJheSByZXR1cm5lZCBmcm9tIGlyb25BamF4IHJlcXVlc3RcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqL1xuICBmdW5jdGlvbiBWZW51ZSh2ZW51ZSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHNlbGYubG9jYXRpb24gPSB7bGF0OiB2ZW51ZS5sb2NhdGlvbi5sYXQsIGxuZzogdmVudWUubG9jYXRpb24ubG5nfTtcbiAgICBzZWxmLm5hbWUgPSB2ZW51ZS5uYW1lO1xuICAgIHNlbGYuY29udGVudCA9XG4gICAgICB2ZW51ZS5uYW1lICtcbiAgICAgICc8YnI+JyArXG4gICAgICAodmVudWUudXJsID09PSB1bmRlZmluZWQgPyAnJyA6ICc8YSBocmVmPVwiJXVybFwiPiV1cmw8L2E+PGJyPicucmVwbGFjZSgvJXVybC9nLCB2ZW51ZS51cmwpKSArXG4gICAgICAodmVudWUubG9jYXRpb24uZm9ybWF0dGVkQWRkcmVzcyA9PT0gdW5kZWZpbmVkID8gJycgOiB2ZW51ZS5sb2NhdGlvbi5mb3JtYXR0ZWRBZGRyZXNzLmpvaW4oJzxicj4nKSk7XG4gICAgc2VsZi5tYXJrZXIgPSBhZGRNYXBNYXJrZXIoc2VsZik7XG4gICAgc2VsZi52aXNpYmxlID0ga28ub2JzZXJ2YWJsZSh0cnVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGb3Vyc3F1YXJlIHJlcXVlc3QgY29uZmlndXJhdGlvblxuICAgKiBAdHlwZSB7e3VybDogc3RyaW5nLCBwYXJhbXM6IHtjbGllbnRfaWQ6IHN0cmluZywgY2xpZW50X3NlY3JldDogc3RyaW5nLCB2OiBzdHJpbmcsIGxsOiBzdHJpbmcsIHF1ZXJ5OiBzdHJpbmcsIGxpbWl0OiBzdHJpbmd9fX1cbiAgICovXG4gIHZhciBmb3Vyc3F1YXJlUmVxdWVzdENvbmZpZyA9IHtcbiAgICB1cmw6ICdodHRwczovL2FwaS5mb3Vyc3F1YXJlLmNvbS92Mi92ZW51ZXMvc2VhcmNoJyxcbiAgICBwYXJhbXM6IHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBxdW90ZS1wcm9wc1xuICAgICAgJ2NsaWVudF9pZCc6ICdETTA0T0tOUU9BRUJHUFc1VU5FWkNNMlNHMkpLWk00TllQTzVGWDFHTjRHMTVCVDAnLFxuICAgICAgJ2NsaWVudF9zZWNyZXQnOiAnRE1PRFBLQ0pLUTJZUVROU0JSMkFRRUVOVlVUMzBNMlJNRlNYU1pJNVlHUEI1TE5GJyxcbiAgICAgICd2JzogJzIwMTMwODE1JyxcbiAgICAgICdsbCc6ICc0MC42MjQ5NTIyLC03My45NjE1MDM2OTk5OTk5OScsXG4gICAgICAncXVlcnknOiAncGl6emEnLFxuICAgICAgJ2xpbWl0JzogJzIwJ1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgYXBwXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBlbGVtZW50SWQgLSBIVE1MIGVsZW1lbnQgZm9yIHRoZSBtYXBcbiAgICogQHBhcmFtIHtvYmplY3R9IHdpbmRvdyAtIHRoZSBnbG9iYWwgd2luZG93IG9iamVjdFxuICAgKiBAcGFyYW0ge29iamVjdH0gZG9jdW1lbnQgLSB0aGUgZ2xvYmFsIGRvY3VtZW50IG9iamVjdFxuICAgKiBAcGFyYW0ge29iamVjdH0gaXJvbkFqYXggLSBpcm9uLWFqYXggUG9seW1lciBlbGVtZW50IHVzZWQgZm9yIGFqYXggcmVxdWVzdHNcbiAgICovXG4gIHNlbGYuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uIChlbGVtZW50SWQsIHdpbmRvdywgZG9jdW1lbnQsIGlyb25BamF4KSB7XG4gICAgc2VsZi53aW5kb3cgPSB3aW5kb3c7XG4gICAgc2VsZi5kb2N1bWVudCA9IGRvY3VtZW50O1xuICAgIHNlbGYuaXJvbkFqYXggPSBpcm9uQWpheDtcblxuICAgIC8vIHNlbGYuaXJvbkFqYXguYWRkRXZlbnRMaXN0ZW5lcigncmVxdWVzdCcsIGZ1bmN0aW9uIChlKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICAvLyAgIHNlbGYuaXJvbkFqYXgubGFzdFJlc3BvbnNlLnJlc3BvbnNlLnZlbnVlcztcbiAgICAvLyB9KTtcblxuICAgIC8vIGFkZCByZXNwb25zZSBsaXN0ZW5lciBmb3IgaXJvbiBhamF4IHJlcXVlc3RzXG4gICAgc2VsZi5pcm9uQWpheC5hZGRFdmVudExpc3RlbmVyKCdyZXNwb25zZScsIGZ1bmN0aW9uIChlKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICAgIHZhciByZXNwb25zZVZlbnVlcyA9IHNlbGYuaXJvbkFqYXgubGFzdFJlc3BvbnNlLnJlc3BvbnNlLnZlbnVlcztcblxuICAgICAgLy8gY3JlYXRlIG5ldyBWZW51ZSBvYmplY3RzIGZvciB0aGUgdmVudWVzIGFycmF5IGJhc2VkIG9uIHRoZSB2ZW51ZXMgZGF0YSBmcm9tIHRoZSByZXF1ZXN0XG4gICAgICByZXNwb25zZVZlbnVlcy5mb3JFYWNoKGZ1bmN0aW9uICh2ZW51ZSkge1xuICAgICAgICBzZWxmLnZlbnVlcy5wdXNoKG5ldyBWZW51ZSh2ZW51ZSkpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIHRoZSBhcnJheSBpcyBidWlsdCwgbm93IGNlbnRlciB0aGUgbWFwIHRvIGNlbnRlciBvZiBib3VuZHNcbiAgICAgIGlmIChyZXNwb25zZVZlbnVlcy5sZW5ndGgpIHtcbiAgICAgICAgc2VsZi5tYXAuc2V0Q2VudGVyKHNlbGYuYm91bmRzLmdldENlbnRlcigpKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIGFkZCBlcnJvciBsaXN0ZW5lciBmb3IgaXJvbiBhamF4IHJlcXVlc3RzXG4gICAgc2VsZi5pcm9uQWpheC5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIGZ1bmN0aW9uIChlKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICAgIHNlbGYud2luZG93LmFsZXJ0KFxuICAgICAgICAnRm91cnNxdWFyZSBkYXRhIGNvdWxkIG5vdCBiZSByZXRyaWV2ZWQuJyArXG4gICAgICAgICdcXG5TdGF0dXM6ICcgK1xuICAgICAgICBlLmRldGFpbC5yZXF1ZXN0LnN0YXR1cyArXG4gICAgICAgICdcXG5TdGF0dXMgVGV4dDogJyArXG4gICAgICAgIGUuZGV0YWlsLnJlcXVlc3Quc3RhdHVzVGV4dFxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIC8vIGNvbmlmZ3VyZSBpcm9uQWpheCB0byB1c2UgcHJlZGVmaW5lIEZvdXJzcXVhcmUgcmVxdWVzdFxuICAgIGlyb25BamF4LnVybCA9IGZvdXJzcXVhcmVSZXF1ZXN0Q29uZmlnLnVybDtcbiAgICBpcm9uQWpheC5wYXJhbXMgPSBmb3Vyc3F1YXJlUmVxdWVzdENvbmZpZy5wYXJhbXM7XG5cbiAgICAvLyBleGVjdXRlIGFuIGFqYXggcmVxdWVzdFxuICAgIHNlbGYuaXJvbkFqYXguZ2VuZXJhdGVSZXF1ZXN0KCk7XG5cbiAgICAvLyBpbml0aWFsaXplIG1hcCBvbiBzcGVjaWZpZWQgSFRNTCBlbGVtZW50XG4gICAgaW5pdGlhbGl6ZU1hcChlbGVtZW50SWQpO1xuXG4gICAgLy8gYXBwbHkga25vY2tvdXQgYmluZGluZ3NcbiAgICBrby5hcHBseUJpbmRpbmdzKHNlbGYpO1xuICB9O1xufVxuIl0sImZpbGUiOiJhcHAuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
