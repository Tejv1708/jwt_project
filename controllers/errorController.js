import AppError from '../utils/appError.js';

const handleCastErrrorDB = (err) => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg(/(["'])(\\?.)*?\1/)[0];
  console.log(value);
  const message = `Duplicate field value x . Please use another value `;
  return new AppError(message, 400);
};

const handleValidationErrorDb = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data . ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = (err) => {
  new AppError('Invalid token , Please login again', 400);
};

const handleJWTExpiredError = (err) => {
  new AppError('Your token expired ! Please log in again');
};

export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};

const sendErrorProd = (err, res) => {
  // Operation Error , trusted Error : send message to cliten
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // 1)  Log Error
    console.error('ERROR ', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong ',
    });
  }
};

export const CastError = (req, res) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorProd(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (error.name === 'CastError') error = handleCastErrrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDb(err);

    if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (error.name === 'TokenExpiredError')
      error = handleJWTExpiredError(error);
    sendErrorProd(error, res);
  }
};
