const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  title:{type:String,required:true},
  imgUrl: { type: String, required: true },
  size:[{type:String,enum:["S","M","L","XL","XXL"]}],
  description: { type: String },
  price: { type: Number ,required:true},
  discount: { type: Number ,required:true},
  category: [{ type: String, enum: ["Men", "Women", "Kids"], required: true }],
  rating:{type:Number,min:1,max:5}
},{timestamps:true})

const ProductModel = mongoose.model("ecomquery",productSchema)

module.exports = ProductModel