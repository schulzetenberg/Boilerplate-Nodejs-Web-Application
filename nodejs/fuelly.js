const { parseString } = require('xml2js');

const FuellyModel = require('../models/fuelly-model');
const appConfig = require('./app-config');
const api = require('./api');

exports.save = (userId) =>
  appConfig.get(userId).then((config) => {
    if (!config && config.fuelly && config.fuelly.vehicles && config.fuelly.vehicles.length) {
      return Promise.reject('No vehicles');
    }

    const vehiclePromises = config.fuelly.vehicles.map((vehicle) => carData(vehicle, userId));

    return Promise.all(vehiclePromises).then(() => Promise.resolve());
  });

function carData(config, userId) {
  const url = config && config.url;

  if (!url) {
    return Promise.reject('Missing fuelly config');
  }

  return api.get({ url }).then((body) => {
    try {
      const data = [];

      parseString(body, (err, result) => {
        if (err) {
          return Promise.reject(err);
        }

        const entries = result.rss.channel[0].item;

        if (!entries || !entries.length) {
          return Promise.reject(`No fuel data from fuelly for ${config.name}`);
        }

        for (let i = 0, x = entries.length; i < x; i += 1) {
          const desc = entries[i].description[0];

          const milesIndex = desc.indexOf('Miles:');
          const milesBreak = desc.indexOf('<br />', milesIndex);
          const miles = parseFloat(desc.substring(milesIndex + 7, milesBreak));

          const gallonsIndex = desc.indexOf('Gallons:');
          const gallonsBreak = desc.indexOf('<br />', gallonsIndex);
          const gallons = parseFloat(desc.substring(gallonsIndex + 9, gallonsBreak));

          const priceIndex = desc.indexOf('Price: $');
          let price = 0;
          if (priceIndex > -1) {
            price = parseFloat(desc.substring(priceIndex + 8, priceIndex + 12));
          }

          const fillTime = entries[i].pubDate[0];

          data.push({ fillTime, miles, gallons, price, name: config.name });
        }
      });

      const savePromises = data.map((x) => save(x, userId));

      return Promise.all(savePromises).then(() => Promise.resolve());
    } catch (err) {
      Promise.reject(err);
    }
  });
}

function save(data, userId) {
  const filter = {
    name: data.name,
    date_added: data.date_added,
    userId,
  };

  return FuellyModel.findOne(filter, {}, { sort: { _id: -1 } })
    .lean()
    .then((oldData) => {
      // If fillTime already exists in DB, do not save duplicate data
      if (!oldData) {
        const doc = new FuellyModel({ ...data, userId });
        return doc.save();
      }
    });
}
