const mongoose = require('mongoose');
const validator = require('validator');
const { ERRORS } = require('@constants/tdb-constants');

const carsSchema = new mongoose.Schema(
  {
    country: {
      type: String,
      required: [true, ERRORS.REQUIRED.COUNTRY_NAME],
    },
    province: {
      type: String,
      required: [true, ERRORS.REQUIRED.PROVINCE_NAME],
    },
    city: {
      type: String,
      required: [true, ERRORS.REQUIRED.CITY_NAME],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        // default: 'Point',
      },
      coordinates: [Number],
      address: String,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    image: [String],
    version: {
      type: String,
    },
    regNumber: {
      type: String,
      unique: true,
      index: true,
      validate: [
        validator.isAlphanumeric,
        `${ERRORS.INVALID.INVALID_REG_NUM}.${ERRORS.REQUIRED.APLHA_NUMERIC_REQUIRED}`,
      ],
      required: [true, ERRORS.REQUIRED.REG_NUMBER_REQUIRED],
    },
    model: {
      type: String,
      required: [true, ERRORS.REQUIRED.CAR_MODEL_REQUIRED],
    },
    modelYear: {
      type: Number,
      min: [1960, ERRORS.INVALID.INVALID_MODEL_YEAR],
      max: [Number(new Date().getFullYear()), ERRORS.INVALID.INVALID_MODEL_YEAR],
      required: [true, ERRORS.REQUIRED.MODEL_YEAR_REQUIRED],
    },
    make: {
      type: String,
      required: [true, ERRORS.REQUIRED.CAR_MAKE_REQUIRED],
    },
    price: {
      type: Number,
      min: [10000, ERRORS.INVALID.MINIMUM_PRICE],
      required: [true, ERRORS.REQUIRED.PRICE_REQUIRED],
    },
    engineType: {
      type: String,
      required: [true, ERRORS.REQUIRED.ENGINE_TYPE_REQUIRED],
      trim: true,
    },
    transmission: {
      type: String,
      required: [true, ERRORS.REQUIRED.TRANSMISSION_TYPE_REQUIRED],
      enum: {
        values: ['Manual', 'Automatic'],
        message: ERRORS.INVALID.INVALID_TRANSMISSION_TYPE,
      },
    },
    condition: {
      type: String,
      required: [true, ERRORS.REQUIRED.CONDITION_REQUIRED],
      enum: {
        values: ['Excellent', 'Good', 'Fair'],
        message: ERRORS.INVALID.INVALID_CONDITION,
      },
    },
    bodyType: {
      type: String,
      required: [true, ERRORS.REQUIRED.BODY_TYPE_REQUIRED],
      trim: true,
    },
    bodyColor: {
      type: String,
      required: [true, ERRORS.REQUIRED.BODY_COLOR_REQUIRED],
    },
    engineCapacity: {
      type: Number,
      min: [200, ERRORS.INVALID.MINIMUM_ENGINE_CAPACITY],
      required: [true, ERRORS.REQUIRED.ENGINE_CAPACITY_REQUIRED],
    },
    registrationCity: {
      type: String,
      trim: true,
      required: [true, ERRORS.REQUIRED.REGISTRATION_CITY],
    },
    milage: {
      type: Number,
      required: [true, ERRORS.REQUIRED.MILAGE_REQUIRED],
    },
    assembly: {
      type: String,
      required: [true, ERRORS.REQUIRED.ASSEMBLY_REQUIRED],
      enum: {
        values: ['Local', 'Imported'],
        message: ERRORS.INVALID.INVALID_ASSEMBLY,
      },
    },
    features: [{ type: String, required: [true, ERRORS.REQUIRED.FEATURES_REQUIRED] }],
    description: {
      type: String,
      required: [true, ERRORS.REQUIRED.DESCRIPTION_REQUIRED],
    },
    favOf: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    associatedPhone: {
      type: String,
      validate: [validator.isMobilePhone, ERRORS.INVALID.INVALID_PHONE_NUM],
    },
    soldByUs: {
      type: Boolean,
    },
    isFav: {
      type: Boolean,
      default: undefined,
    },
    isSold: {
      type: Boolean,
      index: true,
      default: false,
    },
    active: {
      type: Boolean,
      index: true,
      default: true,
    },
    sellerType: {
      type: String,
      required: [true, ERRORS.REQUIRED.SELLER_TYPE_REQUIRED],
      enum: {
        values: ['Dealer', 'Individual'],
        message: ERRORS.INVALID.INVALID_SELLER_TYPE,
      },
    },
    banned: {
      type: Boolean,
      index: true,
      default: false,
    },
    imageStatus: {
      type: Boolean,
    },
    views: {
      type: Number,
      default: 0,
    },
    selectedImage: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

carsSchema.index({ active: -1, isSold: 1, banned: 1 });
carsSchema.index({ location: '2dsphere' });

carsSchema.index({
  country: 'text',
  province: 'text',
  city: 'text',
  model: 'text',
  make: 'text',
  bodyColor: 'text',
  engineType: 'text',
  condition: 'text',
  bodyType: 'text',
  assembly: 'text',
  transmission: 'text',
});

// carsSchema.pre('save', function (next) {
//   if (this.isNew && Array.isArray(this.location) && 0 === this.location.length) {
//     this.location = undefined;
//   }
//   next();
// })

const Car = mongoose.model('Car', carsSchema);

module.exports = Car;
