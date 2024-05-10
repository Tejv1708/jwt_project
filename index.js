import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { globalErrorHandler } from './controllers/errorController.js';
import path from 'path';
import userRoutes from './Routes/userRoutes.js';
import commentRoutes from './Routes/commentRoutes.js';
import tourRoutes from './Routes/tourRoutes.js';
import reviewRouter from './Routes/reviewRoutes.js';
import AppError from './utils/appError.js';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';

process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception Shutting down');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config();

const app = express();
// GLOBAL MIDDLEWARE
// Set Security Http header

app.use(helmet());
// Development loggin
if (process.env.NODE_ENV === 'development') {
  app.use(
    morgan('dev', {
      skip: (req, res) => req.url.startsWith('/socket.io/'),
    }),
  );
}
// Limit request from same Api
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP , Please try again in an hour ',
});
app.use('/api', limiter);

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
// Data sanitization against NoSQL query injection
app.use(mongoSanitize());
// Body parser , reading data from body into req.body
app.use(
  express.json({
    limit: '10kb',
  }),
);

//Data sanitization again XSS
app.use(xss());
// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'difficulty',
      'maxGroupSize',
      'price',
    ],
  }),
);

// Routes
app.use('/api/user', userRoutes);
app.use('/api/comment', commentRoutes);
app.use('/api/tour', tourRoutes);
app.use('/api/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server`,
  // });

  // const err = new Error(`Can't find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;
  // next(err);

  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

// Allow server side file in your application
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory
// Serving static files
app.use(express.static(`${__dirname}/public`));
// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.headers);
});
const port = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log('Connect to mongoDB');
  })
  .catch((err) => {
    console.log(err);
  });

const server = app.listen(port, () => {
  console.log(`listening on port ${port}`); // Include the port number in the log message
});

process.on('unhandledRejection', (err) => {
  console.log(err);
  console.log('Unhandle Rejection Shutting down');
  server.close(() => {
    process.exit(1);
  });
});
