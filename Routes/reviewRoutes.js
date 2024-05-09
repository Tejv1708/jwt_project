import express from 'express';
import { protect, restrictTo } from '../controllers/authController.js';
import {
  createReview,
  deleteReview,
  getAllReview,
  getReview,
  setTourUserIds,
  updateReview,
} from '../controllers/reviewController.js';

const router = express.Router({ mergeParams: true });

router.use(protect);

router
  .route('/')
  .get(getAllReview)
  .post(restrictTo('user'), setTourUserIds, createReview);

router
  .route('/:id')
  .get(getReview)
  .patch(restrictTo('user', 'admin'), updateReview)
  .delete(restrictTo('user', 'admin'), deleteReview);

export default router;
