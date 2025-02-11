const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  userName: { type: String, required: true ,unique:true},
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fisrtName: { type: String },
  lastName: { type: String },
  lastName: { type: String },
  mobileNumber: {type:String}
}, { timestamps: true })
const UserModel = mongoose.model("ecomusers", userSchema)

module.exports = UserModel