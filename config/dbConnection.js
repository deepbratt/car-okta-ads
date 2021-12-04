const mongoose = require('mongoose');
//const {MongooseQueryLogger} = require('mongoose-query-logger');
const db = process.env.NODE_ENV === 'production' ? process.env.DB_REMOTE : process.env.DB_LOCAL;
// console.log(process.env.NODE_ENV);
// console.log(db);
const dbConnect = async () => {
  try {
    await mongoose.connect(db, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      autoIndex: true,
    });
    console.log('DB Connected Successfuly');
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

// const queryLogger = new MongooseQueryLogger();

// // // optionally add custom configuration eg:
// // queryLogger
// // 	.setExplain(true)
// // 	.setAdditionalLogProperties(true)
// // 	.setQueryLogger(myCustomQueryLogger)
// // 	.setExplainLogger(myCustomExplainLogger);

// mongoose.plugin(queryLogger.getPlugin());

module.exports = dbConnect;
