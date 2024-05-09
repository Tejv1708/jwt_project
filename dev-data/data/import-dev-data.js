import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Tour from '../../model/tourModel.js';
import User from '../../model/User.js';
import Review from '../../model/reviewModel.js';
dotenv.config();

const DB = process.env.MONGO_URL;
mongoose.connect(DB).then(() => console.log('DB connection successful '));

// READ JSON FILE
const toursPath = `${process.cwd()}/dev-data/data/tours.json`;
const userPath = `${process.cwd()}/dev-data/data/users.json`;
const reviewsPath = `${process.cwd()}/dev-data/data/reviews.json`;

const tours = JSON.parse(fs.readFileSync(toursPath, 'utf-8'));
const users = JSON.parse(fs.readFileSync(userPath, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(reviewsPath, 'utf-8'));

const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data successfully loaded');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// DELETE ALL DATA FROM DB
const deleteData = async () => {
  try {
    // Delete all the data
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully deleted!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

console.log(process.argv);
