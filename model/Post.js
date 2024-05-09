import mongoose from "mongoose";

const blogPostSchema = new mongoose.Schema({
  title: String,
  content: String,
  tags: [String],
  //   authors: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  creationDate: { type: Date, default: Date.now },
});

const Post = mongoose.model("BlogPost", blogPostSchema);
export default Post;
