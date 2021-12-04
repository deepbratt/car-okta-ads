const express = require('express');
const dotenv = require('dotenv');
const cluster = require('cluster');
const os = require('os');
const morgan = require('morgan');
const cors = require('cors');
const session = require('cookie-session');
const compression = require('compression');
dotenv.config({ path: './config/config.env' }); // read config.env to environmental variables
require('./config/dbConnection')(); // db connection
const numCpu = os.cpus().length;
const PORT = 3003; // port

const { errorHandler, AppError } = require('@utils/tdb_globalutils');

const receivers = require('./utils/rabbitMq');

const adsRoutes = require('./constants/consts').routeConsts.carRoutes;
const adsRouter = require('./routes/carRoutes');

const app = express();

// CORS
app.use(cors());
app.options('*', cors());
app.use(morgan('dev'));

// GLOBAL MIDDLEWARES
app.use(express.json()); // body parser (reading data from body to req.body)
//app.use(cookieParser()); // cookie parser (reading data from cookie to req.cookie)
app.use(
	session({
		signed: false,
	})
);

app.use(compression());
//routes
receivers.userbanReceiver();
app.use(adsRoutes, adsRouter);
app.all('*', (req, res, next) => {
	next(new AppError(`can't find ${req.originalUrl} on this server`, 404));
});

app.use(errorHandler);

if (cluster.isMaster) {
	for (let i = 0; i < numCpu; i++) {
		cluster.fork();
	}
} else {
	app.listen(PORT, () => {
		console.log(`${process.pid} listening on ${PORT}`);
	});
}
