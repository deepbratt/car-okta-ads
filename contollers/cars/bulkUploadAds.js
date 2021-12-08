const Car = require('../../models/cars/carModel');
const BulkUploads = require('../../models/bulkUploads/bulkUploads');
const { AppError, catchAsync } = require('@utils/tdb_globalutils');
const { STATUS, STATUS_CODE, SUCCESS_MSG, ERRORS } = require('@constants/tdb-constants');
const fastcsv = require('fast-csv');
const { uploadFile } = require('../../utils/fileUpload');
const { filter } = require('../factory/factoryHandler');

// const validateAdsCSVTemplate = async (req, next) => {
//   return new Promise((resolve, reject) => {
//     var csvValidationResult = [];
//     var missingFields = [];
//     var uploadData = [];
//     var result = { isValid: true, message: '', failureReason: '', misingFields: '', data: [] };
//     csv
//       .parseString(req.file.buffer, { headers: true })
//       .validate(function (row, cb) {
//         if (row.country === '') missingFields.push('Please add country name');
//         if (row.province === '') missingFields.push('Please add province name');
//         if (row.city === '') missingFields.push('Please add city name');
//         if (row.version === '') missingFields.push('Please add version of car');
//         if (row.regNumber === '') missingFields.push('Please add Registration Number of car');
//         if (row.model === '') missingFields.push('Please add model of car');
//         if (row.make === '') missingFields.push('Please add make of car');
//         if (row.price === '') missingFields.push('Please add price of car');
//         if (row.engineType === '') missingFields.push('Please add engine type of car');
//         if (row.transmission === '') missingFields.push('Please add transmission of car');
//         if (row.condition === '') missingFields.push('Please add condition of car');
//         if (row.bodyType === '') missingFields.push('Please add body ype of car');
//         if (row.bodyColor === '') missingFields.push('Please add body color of car');
//         if (row.engineCapacity === '') missingFields.push('Please add engine Capacity of car');
//         if (row.registrationCity === '') missingFields.push('Please add registration City of car');
//         if (row.milage === '') missingFields.push('Please add milage of car');
//         if (row.assembly === '') missingFields.push('Assembly should be Local or Imported');
//         if (row.description === '') missingFields.push('Please add description of car');
//         if (row.sellerType === '') missingFields.push('Seller Type should be Dealer or Individual');

//         // Add all other field validations
//         if (missingFields.length > 0) {
//           var unique = missingFields.filter(function (elem, index, self) {
//             return index === self.indexOf(elem);
//           });
//           return cb(null, false, unique.join(', '));
//         } else {
//           return cb(null, true);
//         }
//       })
//       .on('data', (data) => {
//         // you can format data in this point
//         uploadData.push(data);
//       })
//       .on('data-invalid', (row, rowNumber, reason) => {
//         if (reason) {
//           console.log(
//             `${req.file.originalname} is invalid file. Invalid [rowNumber=${rowNumber}] `,
//           );

//           result.isValid = false;
//           result.message = ` ${req.file.originalname} is invalid file. Invalid [rowNumber=${rowNumber}]  `;
//           result.misingFields = reason;
//         }
//       })
//       .on('end', () => {
//         result.data.push(uploadData);
//         csvValidationResult.push(result);
//         resolve(csvValidationResult);
//       });
//   });
// };

// exports.createBulkUploads = catchAsync(async (req, res, next) => {
//   try {
//     const csvValidationResult = await validateAdsCSVTemplate(req, next);
//     console.log(csvValidationResult[0].data[0]);

//     if (csvValidationResult[0].isValid === true) {
//       const { successRecords, errorRecords } = await validateCSVData(csvValidationResult[0].data);

//       if (successRecords.length > 0) {
//       }
//       if (errorRecords.length > 0) {
//         // insert to new db collection
//       }

//       let response = await uploadFile(req.file); // Upload the file to S3 and track the deatils in DB collection
//       // const file = req.file;
//       // const { Location } = await uploadFile(file);
//       // req.body.csvFile = Location;
//       // console.log(csvValidationResult[0].data[0]);
//       csvValidationResult[0].data[0].forEach((e) => {
//         e.createdBy = req.params.id;
//       });

//       await Car.create(csvValidationResult[0].data[0]);
//       console.log(csvValidationResult[0].data[0]);
//       res.status(200);
//       result = {
//         code: STATUS_CODE.CREATED,
//         status: STATUS.SUCCESS,
//         message: 'Ads uploaded successfully',
//         details: response.details,
//       };
//       res.json(result);
//     } else {
//       console.log(csvValidationResult[0].data[0].length);
//       res.status(403).json({
//         status: STATUS.FAIL,
//         message: 'Invalid CSV template',
//         details: {
//           failed: {
//             fieldValidationResult: {
//               csvUploaded: req.file.originalname,
//               message: csvValidationResult[0].message,
//               missingFields: csvValidationResult[0].misingFields,
//               reason: csvValidationResult[0].reason,
//               // referenceId: referenceId,
//             },
//           },
//         },
//       });
//     }
//   } catch (ex) {
//     console.log('Ads upload failed');
//     const error = {
//       code: 400,
//       status: 'FAILED',
//       message: 'Bad Request',
//       err: ex.message,
//     };
//     res.status(500);
//     res.json(error);
//   }
// });

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

  const failedCount = await filter(BulkUploads.find({ status: 'fail' }), req.query);

  const successCount = totalCount - failedCount[0].length;

  res.status(STATUS_CODE.OK).json({
    status: STATUS.SUCCESS,
    message: SUCCESS_MSG.SUCCESS_MESSAGES.OPERATION_SUCCESSFULL,
    countOnPage: result.length,
    totalCount: totalCount,
    successcount: successCount,
    failedCount: failedCount[0].length,
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

  const failedCount = await filter(BulkUploads.find({ status: 'fail' }), req.query);

  const successCount = totalCount - failedCount[0].length;

  if (result.length === 0)
    return next(new AppError(ERRORS.INVALID.NOT_FOUND, STATUS_CODE.NOT_FOUND));

  res.status(STATUS_CODE.OK).json({
    status: STATUS.SUCCESS,
    message: SUCCESS_MSG.SUCCESS_MESSAGES.OPERATION_SUCCESSFULL,
    countOnPage: result.length,
    totalCount: totalCount,
    successcount: successCount,
    failedCount: failedCount[0].length,
    data: {
      result,
    },
  });
});
