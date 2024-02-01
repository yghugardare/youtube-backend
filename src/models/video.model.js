import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new Schema(
  {
    videoFile: {
      type: String, // cloudinary
      required: true,
    },
    thumbnail: {
      type: String, // cloudinary
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // cloudinary
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: mongoose.Types.ObjectId,
      refs: "User",
    },
  },
  { timestamps: true }
);
// primary purpose of this plugin is to enable pagination when using MongoDB's aggregation framework for querying the "videos" collection.
//  introduces the paginate() method, allowing you to perform paginated aggregations on the "videos" collection.
videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
