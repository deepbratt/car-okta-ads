const express = require('express');
const User = require('../models/user/userModel');
const carController = require('../contollers/cars/carController');
const carModelController = require('../contollers/cars/modelController');
const carVersionController = require('../contollers/cars/versionController');
const adminController = require('../contollers/admin/adminController');
const bodyTypeController = require('../contollers/cars/bodyTypesController');
const carMakeController = require('../contollers/cars/carMakeContoller');
const featuresController = require('../contollers/cars/featuresController');
const colorController = require('../contollers/cars/colorController');
const showNumberController = require('../contollers/cars/showNumberController');
const bulkUploadsController = require('../contollers/cars/bulkUploadAds');
const carFilters = require('../contollers/cars/carFilters');
const { authenticate, checkIsLoggedIn, restrictTo } = require('@auth/tdb-auth');
const {
  permessionCheck,
  favPermessionCheck,
  phoneCheckOnCreate,
  phoneCheckOnupdate,
} = require('../middleware/cars/index');
const { upload } = require('@utils/tdb_globalutils');
const { fileUpload } = require('../utils/fileUpload');
//const cache = require('../utils/cache');
//const cacheExp = 30;
const router = express.Router();
// const { isCached } = require('../utils/redisCache');

router
  .route('/bulk-uploads-stats/:id')
  .get(
    authenticate(User),
    restrictTo('Admin', 'Moderator'),
    bulkUploadsController.getAllBulkUploadsOfUser,
  );

router
  .route('/bulk-ads/:id')
  .post(
    authenticate(User),
    restrictTo('Admin', 'Moderator'),
    fileUpload().single('csvFile'),
    bulkUploadsController.createBulkUploads,
  );
router
  .route('/bulk-ads')
  .get(authenticate(User), restrictTo('Admin', 'Moderator'), bulkUploadsController.getAllBulkAds);

router
  .route('/bulk-ads/:id')
  .get(authenticate(User), restrictTo('Admin', 'Moderator'), bulkUploadsController.getOneBulkAd)
  .patch(authenticate(User), restrictTo('Admin', 'Moderator'), bulkUploadsController.UpdateBulkAd)
  .delete(authenticate(User), restrictTo('Admin', 'Moderator'), bulkUploadsController.deleteBulkAd);

//Show Number
router.post('/show-number/:id', authenticate(User), showNumberController.createShowNumberDetails);
router
  .route('/show-number')
  .get(
    authenticate(User),
    restrictTo('Admin', 'Moderator'),
    showNumberController.getAllShowNumberData,
  );
router
  .route('/show-number/:id')
  .get(
    authenticate(User),
    restrictTo('Admin', 'Moderator'),
    showNumberController.getOneShowNumberDetail,
  )
  .patch(
    authenticate(User),
    restrictTo('Admin', 'Moderator'),
    showNumberController.updateShowNumberDetails,
  )
  .delete(
    authenticate(User),
    restrictTo('Admin', 'Moderator'),
    showNumberController.deleteShowNumberDetails,
  );

// router
//   .route('/show-number/add-detail-of-ad/:id')
//   .patch(authenticate(User), showNumberController.addToShowNumberOfAd);

router
  .route('/show-number/logs/:id')
  .get(
    authenticate(User),
    restrictTo('Admin', 'Moderator'),
    showNumberController.getAllLogsOfOneAd,
  );

//location based search
router.route('/cars-within/:distance/center/:latlng/unit/:unit').get(carController.getCarsWithin);

//colors

router
  .route('/colors')
  .post(authenticate(User), restrictTo('Admin', 'Moderator'), colorController.createOne)
  .get(colorController.getAll);
router
  .route('/colors/:id')
  .get(authenticate(User), restrictTo('Admin', 'Moderator'), colorController.getOne)
  .patch(authenticate(User), restrictTo('Admin', 'Moderator'), colorController.updateOne)
  .delete(authenticate(User), restrictTo('Admin', 'Moderator'), colorController.deleteOne);

// OWNERS LIST
router
  .route('/owners-list')
  .get(authenticate(User), restrictTo('Admin', 'Moderator'), adminController.getAllOwners);

/**
 * Features Routes
 */
router
  .route('/features')
  .get(featuresController.getAllFeatures)
  .post(
    authenticate(User),
    restrictTo('Admin', 'Moderator'),
    upload('image').single('image'),
    featuresController.createFeature,
  );
router
  .route('/features/:id')
  .get(authenticate(User), restrictTo('Admin', 'Moderator'), featuresController.getOneFeature)
  .patch(
    authenticate(User),
    restrictTo('Admin', 'Moderator'),
    upload('image').single('image'),
    featuresController.UpdateOneFeature,
  )
  .delete(authenticate(User), restrictTo('Admin', 'Moderator'), featuresController.deleteFeature);

/**
 * Total cars sold and sold in Current month.
 * Total cars Sold by our platform and  total cars sold by platform in Current month.
 */
router
  .route('/sold-cars-stats')
  .get(authenticate(User), restrictTo('Admin', 'Moderator'), adminController.totalSoldCars);
router
  .route('/sold-cars-by-platform-stats')
  .get(authenticate(User), restrictTo('Admin', 'Moderator'), adminController.carsSoldByPlatform);

//       CAR BODYTYPES //
router
  .route('/body-types')
  .get(bodyTypeController.getAllBodyTypes)
  .post(
    authenticate(User),
    restrictTo('Admin', 'Moderator'),
    upload('image').single('image'),
    bodyTypeController.createBodyType,
  );
router
  .route('/body-types/:id')
  .get(authenticate(User), restrictTo('Admin', 'Moderator'), bodyTypeController.getOneBodyType)
  .patch(
    authenticate(User),
    restrictTo('Admin', 'Moderator'),
    upload('image').single('image'),
    bodyTypeController.updateBodyType,
  )
  .delete(authenticate(User), restrictTo('Admin', 'Moderator'), bodyTypeController.deleteBodyType);

/////////////////////////////////// Admin Routes ////////////////////////////

router
  .route('/car-owners-stats')
  .get(authenticate(User), restrictTo('Admin', 'Moderator'), adminController.carOwners);
router
  .route('/cars-stats')
  .get(authenticate(User), restrictTo('Admin', 'Moderator'), adminController.cars);
router
  .route('/top-viewed')
  .get(authenticate(User), restrictTo('Admin', 'Moderator'), adminController.views);
router
  .route('/ban/:id')
  .patch(authenticate(User), restrictTo('Admin', 'Moderator'), carController.markbanned);
router
  .route('/unban/:id')
  .patch(authenticate(User), restrictTo('Admin', 'Moderator'), carController.markunbanned);
////////////////////////////// CAR MAKE MODEL ////////////////////////////////////////

// Car Makes
router
  .route('/makes')
  .get(
    //cache(cacheExp),
    carMakeController.getAllMakes,
  )
  .post(authenticate(User), restrictTo('Admin', 'Moderator'), carMakeController.createMake);
router
  .route('/makes/:id')
  .get(
    //cache(cacheExp),
    carMakeController.getOneMake,
  )
  .patch(authenticate(User), restrictTo('Admin', 'Moderator'), carMakeController.updateMake)
  .delete(authenticate(User), restrictTo('Admin', 'Moderator'), carMakeController.deleteMake);

// models with specific make.
router
  .route('/models')
  .get(carModelController.getAllModels)
  .post(authenticate(User), restrictTo('Admin', 'Moderator'), carModelController.createModel);
router
  .route('/models/:id')
  .get(carModelController.getOneModel)
  .patch(authenticate(User), restrictTo('Admin', 'Moderator'), carModelController.updateModel)
  .delete(authenticate(User), restrictTo('Admin', 'Moderator'), carModelController.deleteModel);

// Versions
router.get('/versions', carVersionController.getVersions);
router.post(
  '/add-versions',
  authenticate(User),
  restrictTo('Admin', 'Moderator'),
  carVersionController.addVersion,
);
router.patch(
  '/update-versions/:id',
  authenticate(User),
  restrictTo('Admin', 'Moderator'),
  carVersionController.updateVersion,
);
router.delete(
  '/remove-versions/:id',
  authenticate(User),
  restrictTo('Admin', 'Moderator'),
  carVersionController.removeVersion,
);

////////////////////////////////////////////////////////////////////////////////////////////////////

router
  .route('/')
  .post(
    authenticate(User),
    upload('image').array('image', 20),
    phoneCheckOnCreate,
    carController.createOne,
  );
router.route('/').get(
  checkIsLoggedIn(User), //cache(cacheExp),
  carController.getAll,
);
router.route('/myCars').get(
  authenticate(User), //cache(cacheExp),
  carController.getMine,
);

//////////////////////////////FAVOURITES/////////////////////////////////////////
router.route('/favourites').get(
  authenticate(User), //cache(cacheExp),
  carController.favorites,
);

router
  .route('/add-to-fav/:id')
  .patch(authenticate(User), favPermessionCheck, carController.addtoFav);
router.route('/remove-from-fav/:id').patch(authenticate(User), carController.removeFromFav);

///////////////////////MARK ACTIVE/SOLD////////////////////////////////////
router.route('/mark-sold/:id').patch(
  authenticate(User), //cache(cacheExp),
  permessionCheck,
  carController.markSold,
);
router.route('/mark-unsold/:id').patch(
  authenticate(User),
  //cache(cacheExp),
  permessionCheck,
  carController.unmarkSold,
);
router.route('/mark-active/:id').patch(
  authenticate(User),
  //cache(cacheExp),
  permessionCheck,
  carController.markActive,
);
router.route('/mark-inactive/:id').patch(
  authenticate(User), //cache(cacheExp),
  permessionCheck,
  carController.unmarkActive,
);
/////////////////////////////////////////////////////////////////////////////////////////////
router
  .route('/:id')
  .get(
    checkIsLoggedIn(User), //cache(cacheExp),
    carController.getOne,
  )
  .patch(
    authenticate(User),
    permessionCheck,
    upload('image').array('image', 20),
    phoneCheckOnupdate,
    carController.updateOne,
  )
  .delete(authenticate(User), permessionCheck, carController.deleteOne);
/////////////////////////////////////////////////////////////////////////////////////////////
//city filter
////////////////////////////////////////////////////////////////////////////////////////////
router.route('/filter/cities-with-cars').get(
  //cache(cacheExp),
  carFilters.getCitiesByProvince,
);

module.exports = router;

// To remove Model in models array by finding with Id.
// router.patch('/remove-model/:id', carMakeModelController.removeFromModel);

// router
// 	.route('/make-model')
// 	.get(carMakeModelController.getAllMakesModels)
// 	.post(carMakeModelController.createMakeModel);
// router
// 	.route('/make-model/:id')
// 	.get(carMakeModelController.getMakeModel)
// 	.patch(carMakeModelController.updateMakeModel)
// 	.delete(carMakeModelController.deleteMakeModel);

////////////////////////////////////////////////////////////////////////////////////////////

// router
//   .route('/cars')
//   .post(authenticate(User), upload('image').array('image', 20), carController.createOne);
// router.route('/cars').get(checkIsLoggedIn(User), carController.getAll);
// router.route('/cars/myCars').get(authenticate(User), carController.getMine);

//router.route('/stats').get(authenticate(User), carController.carStats);
//router.route('/daily-stats/:min/:max').get(authenticate(User), carController.carDailyStats);
//router.route('/cars/daily-stats/:min/:max').get(authenticate(User), carController.carDailyStats);
