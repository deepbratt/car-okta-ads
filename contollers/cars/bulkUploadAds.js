const Car = require('../../models/cars/carModel');
const BulkUploads = require('../../models/bulkUploads/bulkUploads');
const { AppError, catchAsync } = require('@utils/tdb_globalutils');
const { STATUS, STATUS_CODE, SUCCESS_MSG, ERRORS } = require('@constants/tdb-constants');
const fastcsv = require('@fast-csv/parse');
const { uploadFile } = require('../../utils/fileUpload');
const { filter } = require('../factory/factoryHandler');

exports.createBulkUploads = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please insert a CSV File to add data', STATUS_CODE.BAD_REQUEST));
  }

  // Parsing csv file from buffer
  let results = [];
  fastcsv
    .parseString(req.file.buffer, { headers: true, ignoreEmpty: true })
    .validate((data) => data.regNumber !== '')
    .on('data', (data) => results.push(data))
    .on('end', () => {
      if (!results || results.length <= 0) {
        return next(
          new AppError(
            'No data available to insert or something is missing or incorrect',
            STATUS_CODE.BAD_REQUEST,
          ),
        );
      }
    });

  // To get all registrationNumbers from cars collection,
  let duplicate = await Car.aggregate([
    {
      $group: {
        _id: '$regNumber',
      },
    },
    {
      $project: { _id: 1 },
    },
  ]);

  // Extracting values of registrationNumber from csv file and from cars collection
  let allRegNumbers = duplicate.map(({ _id }) => _id);
  let regNumsFromFile = results.map(({ regNumber }) => regNumber);

  // Getting same values from both arrays by comairing both arrays
  const duplicateRegNumbers = allRegNumbers.filter((element) => regNumsFromFile.includes(element));

  // Checking for duplicate reg numbers
  let isFounded = regNumsFromFile.some((val) => allRegNumbers.includes(val));
  // if duplicate regNumber exists then it will return this error
  if (isFounded === true) {
    const failedCase = await BulkUploads.create({
      createdBy: req.user._id,
      userId: req.params.id,
      failedAdsCount: results.length,
      status: 'fail',
    });

    res.status(STATUS_CODE.BAD_REQUEST).json({
      status: STATUS.FAIL,
      message:
        'Please check regNumber column in your CSV File it has Duplicate Registeration Number/Numbers that are already exists! Fix them and try again.',
      duplicateRegNumbers,
      data: {
        failedCase,
      },
    });
  }
  if (!results || results.length <= 0) {
    res.status(400).json({
      status: 'fail',
      message: 'No data available to insert or something is missing or incorrect ',
    });
    // return next(new AppError('No data available to insert ', STATUS_CODE.BAD_REQUEST));
  }

  // inserting key-value pair of createdBy:req.params.id by taking id from params and map it into all elements of array
  results.forEach((e) => {
    e.createdBy = req.params.id;
  });
  // creating records in ads collection from parsed file data
  await Car.create(results);

  // Uploading file to s3 Bucket
  const file = req.file;
  const { Location } = await uploadFile(file);
  req.body.csvFile = Location;

  const result = await BulkUploads.create({
    csvFile: Location,
    createdBy: req.user._id,
    userId: req.params.id,
    successAdsCount: results.length,
    status: 'success',
  });

  if (!result) return next(new AppError(ERRORS.INVALID.NOT_FOUND, STATUS_CODE.NOT_FOUND));

  res.status(STATUS_CODE.CREATED).json({
    status: STATUS.SUCCESS,
    message: SUCCESS_MSG.SUCCESS_MESSAGES.CREATED,
    data: {
      result,
    },
  });
});

exports.getAllBulkAds = catchAsync(async (req, res, next) => {
  const [result, totalCount] = await filter(BulkUploads.find(), req.query);

  if (!result || result.length <= 0) {
    return next(new AppError(ERRORS.INVALID.NOT_FOUND, STATUS_CODE.NOT_FOUND));
  }

  const failedCount = await filter(BulkUploads.find({status:"failed"}));
  const successCount = totalCount - failedCount;
  

  res.status(STATUS_CODE.OK).json({
    status: STATUS.SUCCESS,
    message: SUCCESS_MSG.SUCCESS_MESSAGES.OPERATION_SUCCESSFULL,
    countOnPage: result.length,
    totalCount: totalCount,
    successcount:successCount,
    failedCount:failedCount,
    data: {
      result,
    },
  });
});

exports.getOneBulkAd = catchAsync(async (req, res, next) => {
  const result = await BulkUploads.findById(req.params.id);

  if (!result || result.length <= 0) {
    return next(new AppError(ERRORS.INVALID.NOT_FOUND, STATUS_CODE.NOT_FOUND));
  }

  res.status(STATUS_CODE.OK).json({
    status: STATUS.SUCCESS,
    message: SUCCESS_MSG.SUCCESS_MESSAGES.OPERATION_SUCCESSFULL,
    data: {
      result,
    },
  });
});

exports.UpdateBulkAd = catchAsync(async (req, res, next) => {
  const result = await BulkUploads.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!result || result.length <= 0) {
    return next(new AppError(ERRORS.INVALID.NOT_FOUND, STATUS_CODE.NOT_FOUND));
  }

  res.status(STATUS_CODE.OK).json({
    status: STATUS.SUCCESS,
    message: SUCCESS_MSG.SUCCESS_MESSAGES.UPDATE,
    data: {
      result,
    },
  });
});

exports.deleteBulkAd = catchAsync(async (req, res, next) => {
  const result = await BulkUploads.findByIdAndDelete(req.params.id);

  if (!result || result.length <= 0) {
    return next(new AppError(ERRORS.INVALID.NOT_FOUND, STATUS_CODE.NOT_FOUND));
  }

  res.status(STATUS_CODE.OK).json({
    status: STATUS.SUCCESS,
    message: SUCCESS_MSG.SUCCESS_MESSAGES.DELETE,
  });
});

exports.getAllBulkUploadsOfUser = catchAsync(async (req, res, next) => {
  const [result, totalCount] = await filter(
    BulkUploads.find({ userId: req.params.id }).populate({
      path: 'createdBy',
      model: 'User',
      select: 'firstName lastName phone',
    }),
    req.query,
  );

  const failedCount = await filter(BulkUploads.find({status:"failed"}));
  const successCount = totalCount - failedCount;

  if (result.length === 0)
    return next(new AppError(ERRORS.INVALID.NOT_FOUND, STATUS_CODE.NOT_FOUND));

  res.status(STATUS_CODE.OK).json({
    status: STATUS.SUCCESS,
    message: SUCCESS_MSG.SUCCESS_MESSAGES.OPERATION_SUCCESSFULL,
    countOnPage: result.length,
    totalCount: totalCount,
    successcount:successCount,
    failedCount:failedCount,
    data: {
      result,
    },
  });
});
