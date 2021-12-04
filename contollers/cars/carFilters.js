const Car = require('../../models/cars/carModel');

const { citiesByProvince } = require('../factory/factoryHandler');

exports.getCitiesByProvince = citiesByProvince(Car);
