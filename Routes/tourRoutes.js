import express from 'express';
import {
  createTour,
  getAllTour,
  getTour,
  updateTour,
  deleteTour,
  aliasTopTour,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
} from '../controllers/tourController.js';
import { protect, restrictTo } from '../controllers/authController.js';
import { createReview } from '../controllers/reviewController.js';
import reviewRouter from './reviewRoutes.js';

const router = express.Router();

// router
//   .route('/:tourId/reviews')
//   .post(protect, restrictTo('user'), createReview);

router.use('/:tourId/reviews', reviewRouter);

router.route('/tour-stats').get(protect, getTourStats);
router
  .route('/monthly-plan/:year')
  .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);
router.route('/top-5-cheap').get(protect, aliasTopTour, getAllTour);

router
  .route('/tour-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);
// /tours-distance?distance=233,centre=40,45&unit=mi
// /tours-distance/233/-10,45/unit/mi

router.route('/distance/:latlng/unit/:unit').get(getDistances);

router
  .route('/')
  .get(getAllTour)
  .post(protect, restrictTo('admin', 'lead-guide'), createTour);

router
  .route('/:id')
  .get(protect, getTour)
  .patch(protect, restrictTo('admin', 'lead-guide'), updateTour)
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

export default router;
