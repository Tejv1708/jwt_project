import Comment from '../model/Comment.js';
import catchAsync from '../utils/catchAsync.js';

export const allComment = catchAsync(async (req, res) => {
  const newComment = await Comment.create({
    commenter: req.user,
    text: req.body.text,
    blogPost: req.body.blogPost,
  });

  return res.status(201).json({
    data: {
      newComment,
    },
  });
});
