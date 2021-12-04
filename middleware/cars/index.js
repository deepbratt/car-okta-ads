const Car = require('../../models/cars/carModel');
const User = require('../../models/user/userModel');
const { AppError, catchAsync, uploadS3, APIFeatures } = require('@utils/tdb_globalutils');
const { ERRORS, STATUS, STATUS_CODE, SUCCESS_MSG } = require('@constants/tdb-constants');

exports.permessionCheck = catchAsync(async (req, res, next) => {
  const currentUserId = req.user._id;
  const result = await Car.findById(req.params.id);
  if (!result) return next(new AppError(ERRORS.INVALID.NOT_FOUND, STATUS_CODE.NOT_FOUND));
  if (!currentUserId.equals(result.createdBy) && req.user.role === 'User') {
    return next(new AppError(ERRORS.UNAUTHORIZED.UNAUTHORIZE, STATUS_CODE.UNAUTHORIZED));
  }
  next();
});

exports.favPermessionCheck = catchAsync(async (req, res, next) => {
  const currentUserId = req.user._id;
  const result = await Car.findById(req.params.id);
  if (!result) return next(new AppError(ERRORS.INVALID.NOT_FOUND, STATUS_CODE.NOT_FOUND));
  if (currentUserId.equals(result.createdBy)) {
    return next(new AppError(ERRORS.INVALID.CANT_ADD_FAV, STATUS_CODE.BAD_REQUEST));
  }
  next();
});

exports.phoneCheckOnCreate = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'User') {
    if (!req.body.createdBy) {
      return next(new AppError(ERRORS.REQUIRED.USER_ID, STATUS_CODE.BAD_REQUEST));
    } else {
      const user = await User.findById(req.body.createdBy);
      if (!user.phone) {
        return next(new AppError(ERRORS.REQUIRED.USER_PHONE_NUMBER, STATUS_CODE.FORBIDDEN));
      }
    }
  } else {
    if (!req.user.phone) {
      return next(new AppError(ERRORS.REQUIRED.ADD_PHONE_TO_PROCEED, STATUS_CODE.UNAUTHORIZED));
    }
  }
  next();
});

exports.phoneCheckOnupdate = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'User') {
    const result = await Car.findById(req.params.id).populate('createdBy');
    if (!result.createdBy.phone) {
      return next(new AppError(ERRORS.REQUIRED.USER_PHONE_NUMBER, STATUS_CODE.FORBIDDEN));
    }
  } else {
    if (!req.user.phone) {
      return next(new AppError(ERRORS.REQUIRED.ADD_PHONE_TO_PROCEED, STATUS_CODE.UNAUTHORIZED));
    }
  }
  next();
});
