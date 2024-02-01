comment.model.js
```js
import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
    {
        content: {
            type: String,
            required: true
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video"
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
)

// primary purpose of this plugin is to enable pagination when using MongoDB's aggregation framework for querying the "videos" collection.
//  introduces the paginate() method, allowing you to perform paginated aggregations on the "videos" collection.
commentSchema.plugin(mongooseAggregatePaginate)

export const Comment = mongoose.model("Comment", commentSchema)
```

like.model.js
```js
import mongoose, {Schema} from "mongoose";


const likeSchema = new Schema({
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    comment: {
        type: Schema.Types.ObjectId,
        ref: "Comment"
    },
    tweet: {
        type: Schema.Types.ObjectId,
        ref: "Tweet"
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    
}, {timestamps: true})

export const Like = mongoose.model("Like", likeSchema)
```

playlist model - 
```js
import mongoose, {Schema} from "mongoose";

const playlistSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    videos: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
}, {timestamps: true})



export const Playlist = mongoose.model("Playlist", playlistSchema)
```

tweet model.js
```js
import mongoose, {Schema} from "mongoose";

const tweetSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {timestamps: true})


export const Tweet = mongoose.model("Tweet", tweetSchema)
```