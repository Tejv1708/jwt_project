import express from 'express';
import {
  forgetPassword,
  login,
  protect,
  resetPassword,
  restrictTo,
  signup,
  updatePassword,
} from '../controllers/authController.js';
import {
  deleteMe,
  deleteUser,
  getAllUsers,
  getMe,
  getUser,
  updateMe,
  updateUser,
} from '../controllers/userController.js';
// import multer from "multer";

// // Image is not directly upload into the database , but the image link is store into the db
// const upload = multer({ dest: "public/img/users" });
const router = express.Router();
// For Auth Purpose
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgotPassword', forgetPassword);
router.patch('/resetPassword/:token', resetPassword);
// Protect all routes after this middleware
router.use(protect);
// For User
router.patch('/updateMyPassword', updatePassword);
router.get('/me', getMe, getUser);

router.patch('/updateMe/', updateMe);
router.delete('/deleteMe', restrictTo('admin', 'lead-guide'), deleteMe);

router.use(restrictTo('admin'));

router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);
router.get('/all', getAllUsers);
export default router;
