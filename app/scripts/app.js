/**
 * Created by Rusty on 4/19/2016.
 */

'use strict';

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

  function initializeMap(elementId) {
    self.map = new google.maps.Map(self.document.getElementById(elementId), {
      disableDefaultUI: true,
      zoom: 11
    });
    self.infoWindow = new google.maps.InfoWindow({map: self.map});
    self.infoWindow.close();
  }

  self.selectVenue = function (selectedVenue) {
    var index;
    var venue;
    var numberOfVenues = self.venues().length;

    if (selectedVenue === self.currentVenue) {
      if (isInfoWindowOpen()) {
        updateInfoWindow(selectedVenue.marker, selectedVenue.name);
      }

      return;
    }

    self.currentVenue(selectedVenue);

    for (index = 0; index < numberOfVenues; index++) {
      venue = self.venues()[index];

      if (self.currentVenue() === venue) {
        clearMapMarkerAnimations(venue.marker);

        if (venue.marker.getAnimation() !== google.maps.Animation.BOUNCE) {
          toggleBounce(venue.marker);
        }

        updateInfoWindow(venue.marker, venue.name);

        break;
      }
    }
  };

  function isInfoWindowOpen() {
    var map = self.infoWindow.getMap();
    return (map !== null && typeof map !== 'undefined');
  }

  function updateInfoWindow(marker, info) {
    self.infoWindow.setContent(info);
    self.infoWindow.open(self.map, marker);
  }

  function toggleBounce(marker) {
    if (marker.getAnimation() === null) {
      marker.setAnimation(google.maps.Animation.BOUNCE);
    } else {
      marker.setAnimation(null);
    }
  }

  function clearMapMarkerAnimations(exceptThisMarker) {
    self.markers.forEach(function (marker) {
      if (exceptThisMarker !== marker) {
        marker.setAnimation(null);
      }
    });
  }

  function addMapMarker(venue) {
    var marker = new google.maps.Marker({
      position: venue.location,
      map: self.map,
      title: venue.name,
      draggable: false,
      animation: google.maps.Animation.DROP
    });

    self.bounds.extend(marker.position);
    self.map.fitBounds(self.bounds);

    google.maps.event.addListener(marker, 'click', function () { // eslint-disable-line no-loop-func
      self.selectVenue(venue);
    });

    self.markers.push(marker);

    return marker;
  }

  self.isSelected = function (venue) {
    return (self.currentVenue() === venue);
  };

  function Venue(venue) {
    var self = this;

    self.location = {lat: venue.location.lat, lng: venue.location.lng};
    self.name = venue.name;
    self.marker = addMapMarker(self);
    self.visible = ko.observable(true);
  }

  var foursquareRequest = {
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

  self.initialize = function (elementId, window, document, ironAjax) {
    self.window = window;
    self.document = document;
    self.ironAjax = ironAjax;

    // self.ironAjax.addEventListener('request', function (e) { // eslint-disable-line no-unused-vars
    //   self.ironAjax.lastResponse.response.venues;
    // });

    self.ironAjax.addEventListener('response', function (e) { // eslint-disable-line no-unused-vars
      var responseVenues = self.ironAjax.lastResponse.response.venues;

      responseVenues.forEach(function (venue) {
        self.venues.push(new Venue(venue));
      });

      if (responseVenues.length) {
        self.map.setCenter(self.bounds.getCenter());
      }
    });

    self.ironAjax.addEventListener('error', function (e) { // eslint-disable-line no-unused-vars
      self.window.alert(
        'Foursquare data could not be retrieved.' +
        '\nStatus: ' +
        e.detail.request.status +
        '\nStatus Text: ' +
        e.detail.request.statusText
      );
    });

    ironAjax.url = foursquareRequest.url;
    ironAjax.params = foursquareRequest.params;

    self.ironAjax.generateRequest();
    initializeMap(elementId);
    ko.applyBindings(self);
  };
}
