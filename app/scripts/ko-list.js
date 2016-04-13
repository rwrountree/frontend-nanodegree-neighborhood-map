/**
 * Created by Rusty on 4/12/2016.
 *
 */

// -----------------------------------------------------------

/**
 *
 * @param {object} locationInfo - pizzeria location info
 * @constructor
 */
function Location(locationInfo) {
  var self = this;
  self.name = locationInfo.name;
  self.street = locationInfo.address.street;
  self.city = locationInfo.address.city;
  self.state = locationInfo.address.state;
  self.zip = locationInfo.address.zip;
  self.lat = locationInfo.location.lat;
  self.lng = locationInfo.location.lng;
}

/**
 *
 * @constructor
 */
function LocationsModel() {
  'use strict';
  var self = this;

  self.locationListData = [
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
      name: 'Totonno',
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

  self.locations = ko.observableArray();
  self.locationListData.forEach(function(elem) {
    self.locations.push(new Location(elem));
  });

  /**
   *
   * @param {object} locInfo - location information
   * @return {string} - formatted address string (first line: street, second line: city, state, and zip
   */
  self.getStreetAddress = function(locInfo) {
    return locInfo.street + ', ' + locInfo.city + ', ' + locInfo.state + ' ' + locInfo.zip;
  };
}

var locationsModel = new LocationsModel();
ko.applyBindings(locationsModel);
console.log(locationsModel.locations()[0]);
