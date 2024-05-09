import User from '../model/User.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { deleteOne, getAll, getOne, updateOne } from './handleFactory.js';

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

export const getAllUsers = getAll(User);
export const getUser = getOne(User);
/// Do Not update password with this
export const updateUser = updateOne(User);
export const deleteUser = deleteOne(User);

export const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

export const updateMe = async (req, res, next) => {
  // Create error if user Posts password data
  if (req.body.password || req.body.passwordConfig) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword ',
        400,
      ),
    );
  }
  // Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  // Update User document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
};

export const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// export const getAllUsers = catchAsync(async (req, res, next) => {
//   const users = await User.find();

//   res.status(200).json({
//     status: 'success',
//     results: users.length,
//     data: {
//       users,
//     },
//   });
// });

// export const getUser = catchAsync(async (req, res) => {
//   const user = await User.findById(req.params.id);
//   res.status(200).json({
//     status: 'success',
//     data: {
//       user,
//     },
//   });
// });
