const RequestIp = require('@supercharge/request-ip');
const Car = require('../../models/cars/carModel');
const CarView = require('../../models/cars/car-views/ip-views-model');
const { AppError, catchAsync, uploadS3 } = require('@utils/tdb_globalutils');
const { STATUS, STATUS_CODE, SUCCESS_MSG, ERRORS } = require('@constants/tdb-constants');
const { filter, stats, dailyAggregate } = require('../factory/factoryHandler');

exports.createOne = catchAsync(async (req, res, next) => {
  if (req.files.selectedImage) {
    let { Location } = await uploadS3(
      req.files.selectedImage[0],
      process.env.AWS_BUCKET_REGION,
      process.env.AWS_ACCESS_KEY,
      process.env.AWS_SECRET_KEY,
      process.env.AWS_BUCKET_NAME,
    );
    req.body.selectedImage = Location;
    var imagePath = Location;
  } else {
    imagePath = req.body.selectedImage;
  }

  if (req.files.image) {
    let array = [];
    if (imagePath !== undefined) {
      array = [imagePath];
    }

    for (var i = 0; i < req.files.image.length; i++) {
      // console.log(req.files.image[i].mimetype);
      let { Location } = await uploadS3(
        req.files.image[i],
        process.env.AWS_BUCKET_REGION,
        process.env.AWS_ACCESS_KEY,
        process.env.AWS_SECRET_KEY,
        process.env.AWS_BUCKET_NAME,
      );
      array.push(Location);
    }
    if (req.body.image) {
      req.body.image = [...req.body.image, ...array];
    } else {
      req.body.image = array;
    }
  }

  if (req.user.role !== 'User') {
    if (!req.body.createdBy) {
      return next(new AppError(ERRORS.REQUIRED.USER_ID, STATUS_CODE.BAD_REQUEST));
    }
  } else {
    req.body.createdBy = req.user._id;
  }

  if (req.user.role === 'User' && (!req.body.image || req.body.image.length <= 0)) {
    return next(new AppError(ERRORS.REQUIRED.IMAGE_REQUIRED, STATUS_CODE.BAD_REQUEST));
  } else if (req.user.role === 'User' && (req.body.image || req.body.image.length >= 0)) {
    req.body.imageStatus = true;
  }

  if (req.user.role !== 'User' && (!req.body.image || req.body.image.length <= 0)) {
    req.body.imageStatus = false;
  } else if (req.user.role !== 'User' && (req.body.image || req.body.image.length >= 0)) {
    req.body.imageStatus = true;
  }

  if (req.user.role === 'User' && req.body.associatedPhone) {
    return next(new AppError(ERRORS.UNAUTHORIZED.ASSOCIATED_PHONE, STATUS_CODE.UNAUTHORIZED));
  }

  const result = await Car.create(req.body);
  if (!result) return next(new AppError(ERRORS.INVALID.NOT_FOUND, STATUS_CODE.NOT_FOUND));

  res.status(STATUS_CODE.CREATED).json({
    status: STATUS.SUCCESS,
    message: SUCCESS_MSG.SUCCESS_MESSAGES.AD_POSTED,
    data: {
      result,
    },
  });
});

exports.getAll = catchAsync(async (req, res, next) => {
  let data;
  if (req.user) {
    if (req.user.role !== 'User') {
      data = await filter(Car.find(), req.query);
    } else {
      data = await filter(
        Car.find({ active: true, isSold: false, banned: false, imageStatus: true }),
        req.query,
      );
    }
  } else {
    data = await filter(
      Car.find({ active: true, isSold: false, banned: false, imageStatus: true }),
      req.query,
    );
  }
  const [result, totalCount] = data;

  if (result.length <= 0) {
    return next(new AppError(ERRORS.INVALID.NOT_FOUND, STATUS_CODE.NOT_FOUND));
  }
  //current user fav status
  if (req.user && req.user.role === 'User') {
    for (var i = 0; i < result.length; i++) {
      if (result[i].favOf) {
        if (result[i].favOf.length > 0 && result[i].favOf.includes(req.user._id)) {
          result[i].isFav = true;
        } else {
          result[i].isFav = false;
        }
      }
    }
  }
  res.status(STATUS_CODE.OK).json({
    status: STATUS.SUCCESS,
    message: SUCCESS_MSG.SUCCESS_MESSAGES.ALL_ADS,
    countOnPage: result.length,
    totalCount: totalCount,
    data: {
      result,
    },
  });
});

exports.getOne = catchAsync(async (req, res, next) => {
  const result = await Car.findById(req.params.id).populate('createdBy');
  if (!result) return next(new AppError(ERRORS.INVALID.NOT_FOUND, STATUS_CODE.NOT_FOUND));
  const ip = RequestIp.getClientIp(req);
  //current user fav status
  if (!result.active || result.banned) {
    if (req.user) {
      const currentUser = req.user._id;
      if (req.user.role === 'User' && !currentUser.equals(result.createdBy._id)) {
        return next(new AppError(ERRORS.INVALID.NOT_FOUND, STATUS_CODE.NOT_FOUND));
      }
    } else {
      return next(new AppError(ERRORS.INVALID.NOT_FOUND, STATUS_CODE.NOT_FOUND));
    }
  }
  if (req.user && req.user.role === 'User') {
    if (result.favOf.includes(req.user._id)) {
      result.isFav = true;
    } else {
      result.isFav = false;
    }
  }

  if (!(await CarView.findOne({ ip: ip, car_id: req.params.id }))) {
    await CarView.create({ ip: ip, car_id: req.params.id });
    await Car.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
  }
  res.status(STATUS_CODE.OK).json({
    status: STATUS.SUCCESS,
    message: SUCCESS_MSG.SUCCESS_MESSAGES.ONE_AD,
    data: {
      result,
    },
  });
});

exports.updateOne = catchAsync(async (req, res, next) => {
  if (req.files.selectedImage) {
    let { Location } = await uploadS3(
      req.files.selectedImage[0],
      process.env.AWS_BUCKET_REGION,
      process.env.AWS_ACCESS_KEY,
      process.env.AWS_SECRET_KEY,
      process.env.AWS_BUCKET_NAME,
    );

    req.body.selectedImage = Location;
    await Car.updateOne({ _id: req.params.id }, { $push: { image: Location } });
    var imagePath = Location;
  } else {
    await Car.updateOne({ _id: req.params.id }, { $push: { image: req.body.selectedImage } });
    imagePath = req.body.selectedImage;
  }

  if (req.files.image) {
    let array = [];
    for (var i = 0; i < req.files.image.length; i++) {
      // console.log(req.files.image[i].mimetype);
      let { Location } = await uploadS3(
        req.files.image[i],
        process.env.AWS_BUCKET_REGION,
        process.env.AWS_ACCESS_KEY,
        process.env.AWS_SECRET_KEY,
        process.env.AWS_BUCKET_NAME,
      );
      array.push(Location);
    }
    if (req.body.image) {
      req.body.image = [...req.body.image, ...array];
    } else {
      req.body.image = array;
    }
  }
  if (req.body.image) {
    let array = [];
    if (imagePath === undefined) {
      const car = await Car.findById(req.params.id);
      const selectedImage = car.selectedImage;
      array = [selectedImage];
    } else {
      array = [imagePath];
    }
    for (var i = 0; i < req.body.image.length; i++) {
      let images = req.body.image[i];
      array.push(images);
    }
    req.body.image = array;
  }

  if (req.user.role === 'User' && (!req.body.image || req.body.image.length <= 0)) {
    return next(new AppError(ERRORS.REQUIRED.IMAGE_REQUIRED, STATUS_CODE.BAD_REQUEST));
  } else if (req.user.role === 'User' && (req.body.image || req.body.image.length >= 0)) {
    req.body.imageStatus = true;
  }

  if (req.user.role !== 'User' && (!req.body.image || req.body.image.length <= 0)) {
    req.body.imageStatus = false;
  } else if (req.user.role !== 'User' && (req.body.image || req.body.image.length >= 0)) {
    req.body.imageStatus = true;
  }

  if (req.user.role === 'User' && req.body.associatedPhone) {
    return next(new AppError(ERRORS.UNAUTHORIZED.ASSOCIATED_PHONE, STATUS_CODE.UNAUTHORIZED));
  }

  const result = await Car.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!result) return next(new AppError(ERRORS.INVALID.NOT_FOUND, STATUS_CODE.NOT_FOUND));
  res.status(STATUS_CODE.OK).json({
    status: STATUS.SUCCESS,
    message: SUCCESS_MSG.SUCCESS_MESSAGES.AD_UPDATED,
    data: {
      result,
    },
  });
});

exports.deleteOne = catchAsync(async (req, res, next) => {
  const result = await Car.findByIdAndDelete(req.params.id);
  if (!result) return next(new AppError(ERRORS.INVALID.NOT_FOUND, STATUS_CODE.NOT_FOUND));
  res.status(STATUS_CODE.OK).json({
    status: STATUS.SUCCESS,
    message: SUCCESS_MSG.SUCCESS_MESSAGES.OPERATION_SUCCESSFULL,
    data: null,
  });
});

exports.getMine = catchAsync(async (req, res, next) => {
  const [result, totalCount] = await filter(Car.find({ createdBy: req.user._id }), req.query);

  if (result.length === 0)
    return next(new AppError(ERRORS.INVALID.NOT_FOUND, STATUS_CODE.NOT_FOUND));

  res.status(STATUS_CODE.OK).json({
    status: STATUS.SUCCESS,
    message: SUCCESS_MSG.SUCCESS_MESSAGES.MY_ADS,
    countOnPage: result.length,
    totalCount: totalCount,
    data: {
      result,
    },
  });
});

exports.addtoFav = catchAsync(async (req, res, next) => {
  const result = await Car.findOne({ _id: req.params.id, favOf: req.user._id });
  if (result) return next(new AppError(ERRORS.INVALID.ALREADY_FAV, STATUS_CODE.BAD_REQUEST));
  await Car.updateOne({ _id: req.params.id }, { $push: { favOf: req.user._id } });
  res.status(STATUS_CODE.OK).json({
    status: STATUS.SUCCESS,
    message: SUCCESS_MSG.SUCCESS_MESSAGES.ADDED_FAV,
  });
});

exports.removeFromFav = catchAsync(async (req, res, next) => {
  const result = await Car.findOne({ _id: req.params.id, favOf: req.user._id });
  if (!result) {
    return next(new AppError(ERRORS.INVALID.NOT_IN_FAV, STATUS_CODE.BAD_REQUEST));
  }
  await Car.updateOne({ _id: req.params.id }, { $pull: { favOf: req.user._id } });
  res.status(STATUS_CODE.OK).json({
    status: STATUS.SUCCESS,
    message: SUCCESS_MSG.SUCCESS_MESSAGES.REMOVED_FAV,
  });
});

exports.favorites = catchAsync(async (req, res, next) => {
  const [result, totalCount] = await filter(Car.find({ favOf: req.user._id }), req.query);

  if (result.length === 0)
    return next(new AppError(ERRORS.INVALID.NOT_FOUND, STATUS_CODE.NOT_FOUND));

  res.status(STATUS_CODE.OK).json({
    status: STATUS.SUCCESS,
    message: SUCCESS_MSG.SUCCESS_MESSAGES.MY_FAVORITE_ADS,
    countOnPage: result.length,
    totalCount: totalCount,
    data: {
      result,
    },
  });
});

exports.markSold = catchAsync(async (req, res, next) => {
  const result = await Car.findOne({ _id: req.params.id, isSold: false });
  if (!result) {
    return next(new AppError(ERRORS.INVALID.MARK_SOLD, STATUS_CODE.BAD_REQUEST));
  }
  await Car.updateOne({ _id: req.params.id }, { isSold: true, soldByUs: req.body.soldByUs });
  res.status(STATUS_CODE.OK).json({
    status: STATUS.SUCCESS,
    message: SUCCESS_MSG.SUCCESS_MESSAGES.MARKED_SOLD,
  });
});

exports.unmarkSold = catchAsync(async (req, res, next) => {
  const result = await Car.findOne({ _id: req.params.id, isSold: true });
  if (!result) {
    return next(new AppError(ERRORS.INVALID.UNMARK_SOLD, STATUS_CODE.BAD_REQUEST));
  }
  await Car.updateOne({ _id: req.params.id }, { isSold: false, soldByUs: undefined });
  res.status(STATUS_CODE.OK).json({
    status: STATUS.SUCCESS,
    message: SUCCESS_MSG.SUCCESS_MESSAGES.MARKED_UNSOLD,
  });
});

exports.markActive = catchAsync(async (req, res, next) => {
  const result = await Car.findOne({ _id: req.params.id, active: false });
  if (!result) {
    return next(new AppError(ERRORS.INVALID.MARK_ACTIVE, STATUS_CODE.BAD_REQUEST));
  }
  await Car.updateOne({ _id: req.params.id }, { active: true });
  res.status(STATUS_CODE.OK).json({
    status: STATUS.SUCCESS,
    message: SUCCESS_MSG.SUCCESS_MESSAGES.MARKED_ACTIVE,
  });
});

exports.unmarkActive = catchAsync(async (req, res, next) => {
  const result = await Car.findOne({ _id: req.params.id, active: true });
  if (!result) {
    return next(new AppError(ERRORS.INVALID.UNMARK_ACTIVE, STATUS_CODE.BAD_REQUEST));
  }
  await Car.updateOne({ _id: req.params.id }, { active: false });
  res.status(STATUS_CODE.OK).json({
    status: STATUS.SUCCESS,
    message: SUCCESS_MSG.SUCCESS_MESSAGES.MARKED_INACTIVE,
  });
});

exports.markbanned = catchAsync(async (req, res, next) => {
  const result = await Car.findOne({ _id: req.params.id, banned: false });
  if (!result) {
    return next(new AppError(ERRORS.INVALID.MARK_BANNED, STATUS_CODE.BAD_REQUEST));
  }
  await Car.updateOne({ _id: req.params.id }, { banned: true });
  res.status(STATUS_CODE.OK).json({
    status: STATUS.SUCCESS,
    message: SUCCESS_MSG.SUCCESS_MESSAGES.MARKED_BANNED,
  });
});

exports.markunbanned = catchAsync(async (req, res, next) => {
  const result = await Car.findOne({ _id: req.params.id, banned: true });
  if (!result) {
    return next(new AppError(ERRORS.INVALID.MARK_UBANNED, STATUS_CODE.BAD_REQUEST));
  }
  await Car.updateOne({ _id: req.params.id }, { banned: false });
  res.status(STATUS_CODE.OK).json({
    status: STATUS.SUCCESS,
    message: SUCCESS_MSG.SUCCESS_MESSAGES.MARKED_UNBANNED,
  });
});

exports.getCarsWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng) {
    return next(new AppError(ERRORS.INVALID.PROVIDE_LAT_LNG, STATUS_CODE.BAD_REQUEST));
  }
  const [result, totalCount] = await filter(
    Car.find({
      location: {
        $geoWithin: { $centerSphere: [[lng, lat], radius] },
      },
    }),
    req.query,
  );
  res.status(200).json({
    status: STATUS.SUCCESS,
    countOnPage: result.length,
    totalCount: totalCount,
    data: {
      result,
    },
  });
});
exports.carStats = stats(Car);
exports.carDailyStats = dailyAggregate(Car);
