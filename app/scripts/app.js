/**
 * Created by Rusty on 4/19/2016.
 */

'use strict';

function APP() { // eslint-disable-line no-unused-vars
  var self = this;
  self.document = null;
  self.map = null;
  self.venues = ko.observableArray();
  self.markers = [];
  self.infoWindow = null;
  self.venuesData = [
    {
      name: 'Di Fara Pizza',
      address: {
        street: '1424 Ave. J',
        city: 'Brooklyn',
        state: 'NY',
        zip: '11230'
      },
      location: {
        lat: 40.6249522,
        lng: -73.96150369999999
      }
    },
    {
      name: 'Totonno Pizzeria Napolitano',
      address: {
        street: '1524 Neptune Ave.',
        city: 'Brooklyn',
        state: 'NY',
        zip: '11224'
      },
      location: {
        lat: 40.5788592,
        lng: -73.9838182
      }
    },
    {
      name: 'Best Pizza',
      address: {
        street: '33 Havemeyer St.',
        city: 'Brooklyn',
        state: 'NY',
        zip: '11211'
      },
      location: {
        lat: 40.7155882,
        lng: -73.9534882
      }
    },
    {
      name: 'Joe & Pat\'s',
      address: {
        street: '1758 Victory Blvd.',
        city: 'Staten Island',
        state: 'NY',
        zip: '10314'
      },
      location: {
        lat: 40.6129407,
        lng: -74.12209729999999
      }
    },
    {
      name: 'Roberta\'s Pizza',
      address: {
        street: '261 Moore St.',
        city: 'Brooklyn',
        state: 'NY',
        zip: '11206'
      },
      location: {
        lat: 40.7050888,
        lng: -73.9335849
      }
    }
  ];
  self.currentVenue = ko.observable(new Venue(self.venuesData[0]));

  function initializeMap(elementId) {
    var index;

    self.map = new google.maps.Map(self.document.getElementById(elementId), {
      disableDefaultUI: true,
      zoom: 11
    });
    self.infoWindow = new google.maps.InfoWindow({map: self.map});
    self.infoWindow.close();

    google.maps.InfoWindow.prototype.isOpen = function () {
      var map = self.infoWindow.getMap();
      return (map !== null && typeof map !== 'undefined');
    };

    for (index = 0; index < self.venuesData.length; index++) {
      self.venues.push(new Venue(self.venuesData[index]));
    }

    self.map.setCenter(self.venues()[0].location);
    // self.selectVenue(self.venues()[0]);
  }

  self.selectVenue = function (selectedVenue) {
    var index;
    var venue;
    var numberOfVenues = self.venues().length;

    if (selectedVenue === self.currentVenue) {
      if (self.infoWindow.isOpen() === false) {
        setInfoWindow(selectedVenue.marker, selectedVenue.name);
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

        setInfoWindow(venue.marker, venue.name);

        break;
      }
    }
  };

  function setInfoWindow(marker, info) {
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
    this.location = {lat: venue.location.lat, lng: venue.location.lng};
    this.name = venue.name;
    this.marker = addMapMarker(this);
  }

  self.initialize = function (elementId, document) {
    self.document = document;
    initializeMap(elementId);
  };
}
