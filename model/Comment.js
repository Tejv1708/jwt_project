import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  commenter: String,
  text: String,
  //   blogPost: { type: mongoose.Schema.Types.ObjectId, ref: "BlogPost " },
  creationDate: { type: Date, default: Date.now },
});

const comment = mongoose.model("Comment", commentSchema);

export default comment;
