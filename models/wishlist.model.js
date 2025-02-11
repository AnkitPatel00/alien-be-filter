const mongoose = require('mongoose')
const {ObjectId} = mongoose.Types

const wishlistSchema = new mongoose.Schema({
  userId: { type: ObjectId,ref:"ecomusers", required: true},
  productId: { type: ObjectId,ref:"ecomquery", required: true}
}, { timestamps: true })
const WishlistModel = mongoose.model("ecomwishlist", wishlistSchema)

module.exports = WishlistModel