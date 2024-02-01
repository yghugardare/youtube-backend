# Learn Mongodb aggregation pipelines

mongodb aggregation pipeline consist of one or more stages that process document, it can return results for group of documents

each stage performs operation on input documents

the documents that are output from a stage are passed to the next stage

```js
db.orders.aggregate([
  //stage 1
  {},
  //stage 2
  {},
  ...//stage n
  {},
]);
```

joining books(which has author_id) collection to author collection

```js
[
  {
    // join
    $lookup: {
      from: "authors", // from which collection
      localField: "author_id",
      foreignField: "_id",
      as: "author_details", // store object in this var
      // usually array is returned
    },
  },
  {
    $addFields: {
      // add field to the document
      author_details: {
        // using the variable as a field
        $first: "$author_details",
      },
    },
  },
];
```

Aggregate pipelines return us the array

$lookup => look for fiels and store it as variable as an **ARRAY**

$size => reutrn size of object/array

$cond => if , then and else

$in : [attribute,field] => if attribute present in the fild or not

$project => project or provide only selected fields to the frontend

in user.controller.js add this function

```js
const getUserChannelProfile = asyncHandler(async(req, res) => {
  // take user name form URL params
  const {username} = req.params;
  // check if username exists
  if (!username?.trim()) {
      throw new ApiError(400, "username is missing")
  }
  // add agregation pipeline to find user channel info
  const channel = await User.aggregate([
    // pipeline 1
    // find user with the username
      {
          $match: {
              username: username?.toLowerCase()
          }
      },
      // pipeline 2
      // look for subscribers of the channel
      {
          $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers"
          }
      },
      // pipeline 3
      // look for how many chanels that 'channel' has subscribed
      {
          $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "subscriber",
              as: "subscribedTo"
          }
      },
      // pipeline 4
      // add additional fields to the schema/document
      // subscribersCount,channelsSubscribedToCount
      // and isSubscribed
      {
          $addFields: {
              subscribersCount: {
                  $size: "$subscribers"
              },
              channelsSubscribedToCount: {
                  $size: "$subscribedTo"
              },
              isSubscribed: {
                  $cond: {
                      if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                      then: true,
                      else: false
                  }
              }
          }
      },
      // pipeline 5 = last pipelin
      // project or provide only selected fields to the frontend
      {
          $project: {
              fullName: 1,
              username: 1,
              subscribersCount: 1,
              channelsSubscribedToCount: 1,
              isSubscribed: 1,
              avatar: 1,
              coverImage: 1,
              email: 1
          }
      }
  ])
  // if channel not there , handle the case
  if (!channel?.length) {
      throw new ApiError(404, "channel does not exists")
  }
  // channel[0] = only one value of the object
  // so that it will be easy for frontend developer
  // to see the values
  return res
  .status(200)
  .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
  )
})
```
