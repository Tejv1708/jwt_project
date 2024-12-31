import { promisify } from 'util';
import User from '../model/User.js';
import dotenv from 'dotenv';
import catchAsync from '../utils/catchAsync.js';
import jwt from 'jsonwebtoken';
import AppError from '../utils/appError.js';
import sendEmail from '../utils/email.js';
import crypto from 'crypto';
import { log } from 'console';

dotenv.config();

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 43 * 60 * 60 * 1000,
    ),
    // Cookie is only send to encrypted options
    // secure: true,
    // Could be modified by browser in any way
    httpOnly: true,
  };
  console.log('developement :', process.env.NODE_ENV);
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  // Remove the password from the user
  user.password = undefined;
  return res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

export const signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });
  console.log('name in env', process.env.JWT_SECRET);
  createSendToken(newUser, 201, res);
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  console.log('Login');
  // 1) check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2) check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  // 3) If everything ok , send token is client
  createSendToken(user, 200, res);
});

export const protect = catchAsync(async (req, res, next) => {
  // Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in ! Please log in to get access', 401),
    );
  }

  // Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // check if user still exits
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError('The user belonging to the token no longer exits'),
    );
  }

  // check if user changed password after the token issue
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return new AppError(
      'User recently changed password ! Please log in again ',
      401,
    );
  }
  // GRANT ACCESS TO PROTECTED
  req.user = freshUser;
  next();
});

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin' , 'lead-guide] role ='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };
};

export const forgetPassword = catchAsync(async (req, res, next) => {
  // Get user based on Posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }
  // Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  // By using validateBeforeSave : false , we can  make not write the required think in postman
  await user.save({ validateBeforeSave: false });
  // Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/user/resetPassword/${resetToken}`;

  const message = `Forget your password ? Submit a PATCH request with your new Password and passwordConfirm to : ${resetURL}.\n If you didn't forget your password , Please ignore this email   `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Try again later ',
        500,
      ),
    );
  }
});

export const resetPassword = catchAsync(async (req, res, next) => {
  // Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  console.log(user);
  // If token has not expired , and there is user , set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();
  // update changedPasswordAt property for the user

  // Log the user in , send jwt token
  createSendToken(user, 200, res);
});

export const updatePassword = catchAsync(async (req, res, next) => {
  // Get the user from the collection
  const user = await User.findById(req.user.id).select('password');
  // Check if Posted current password is correct
  console.log(user);
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }
  // If so update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  //If we use findByIdAndUpdate in this then validation function of passwordConfirm not run and also the pre  middleware not run
  await user.save();
  // Log user in , send JWT
  createSendToken(user, 200, res);
});
