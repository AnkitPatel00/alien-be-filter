const initializeDatabase = require('./db/db.connect')
const express = require("express")
const cors = require('cors')
const ProductModel = require('./models/products.model')
const UserModel = require('./models/users.model')
const bcrypt = require('bcryptjs')
const jwt = require("jsonwebtoken")
const WishlistModel = require('./models/wishlist.model')

const app = express()
app.use(express.json())
app.use(cors({ origin: "*" }))

const jwt_key = process.env.jwt_key

initializeDatabase()

app.get("/", (req,res) => {
  res.send(`<h1>Products Apis</h1>
    <p> - api/products<p>
    `)
})

//token authentication middleware

const jwtAuth = async (req, res, next) => {
  
  const token = req.headers["authorization"]

  if (!token)
  {
   return res.status(400).json({messsage:"token required"})
   }

  try {
    
    const unWrapToken = jwt.verify(token, jwt_key)
    
    if (unWrapToken)
    {
req.user = unWrapToken.user
      next()
    }

  }
  catch (error)
  {
    res.status(500).json({error:"failed to authenticate"})
  }
}

app.get("/api/products", async (req, res) => {
  
  const { search, category, sortByPrice,minRating,minPrice,maxPrice,limit,skip } = req.query
  
  const sortPrice = sortByPrice ? { price: sortByPrice * 1 } : {}
  
  const pLimit = limit * 1 || 9
  const pSkip = skip*1 ||0
  
  const query = {}
  const priceQuery = {}
  
    const searchVal =[{title : {$regex:search,$options:"i"}},
    { description: { $regex: search, $options: "i" } }]
  

  if (search)
  {
    query["$or"] = searchVal
    priceQuery["$or"] = searchVal
  }

  if (category)
  {
    query.category = { $in: category }
    priceQuery.category = { $in: category }
  }
  
  if (minRating)
  {
    query.rating = { $gte: minRating }
     priceQuery.rating = { $gte: minRating }
  }

  if (minPrice && maxPrice)
  {
    query.$and = [{price:{$gte:minPrice*1}},{price:{$lte:maxPrice*1}}]
  }
 else if (minPrice)
  {
    query.price = {$gte:minPrice*1}
  }
  else if (maxPrice)
  {
    query.price = {$lte:maxPrice*1}
  }


  try {

    const highestPrice = await ProductModel.findOne(priceQuery).sort({price:-1})
    const lowestPrice = await ProductModel.findOne(priceQuery).sort({price:1})
    const products = await ProductModel.find(query).sort(sortPrice).limit(pLimit).skip(pSkip)
    const total = await ProductModel.countDocuments(query)

    if (!products)
    {
      res.status(400).json({error:"error in getting products"})
    }
    res.status(200).json({products:products,highestPrice:highestPrice.price,lowestPrice:lowestPrice.price,total:total})
  }
  catch {
    res.status(500).json({error:"failed to get products"})
  }
})

app.post("/api/products",async(req,res) => {
  try {
    const newProduct = new ProductModel(req.body)
    const savedProduct = await newProduct.save()
    if (!savedProduct)
    {
      res.status(400).json({error:"error in saving product"})
    }
    res.status(201).json({message:"product added successfully",product:savedProduct})
  }
  catch {
    res.status(500).json({error:"failed to add products"})
  }
})

app.post("/api/products/many",async(req,res) => {
  try {
    const newProducts = await ProductModel.insertMany(req.body)
   
    if (!newProducts)
    {
      res.status(400).json({error:"error in saving product"})
    }
    res.status(201).json({message:"all product added successfully",products:newProducts})
  }
  catch {
    res.status(500).json({error:"failed to add products"})
  }
})

app.delete("/api/products/many",async(req,res) => {
  try {
    const deletedProducts = await ProductModel.deleteMany()
   
    if (!deletedProducts)
    {
      res.status(400).json({error:"error in deleting product"})
    }
    res.status(201).json({message:"all product deleted successfully"})
  }
  catch {
    res.status(500).json({error:"failed to delete products"})
  }
})


//** Users *//


//register user

app.post("/api/users", async (req,res) => {

  const {userName,email,password} = req.body

  try {

    //username exist
    const isUsernameExist = await UserModel.findOne({userName})



    if (isUsernameExist)
    {
     return res.status(409).json({error:"username has already been taken."})
    }
    if (userName.includes(" "))
    {
     return res.status(400).json({error:"remove space from username."})
    }
    //email exist
    const isEmailExist = await UserModel.findOne({email})

    if (isEmailExist)
    {
     return res.status(409).json({error:"email already exist"})
    }

    if (password.length<=5)
    {
     return res.status(400).json({error:"password more then 5 latters"})
    }

const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
  
    const newUser = new UserModel({userName,email,password:hashedPassword})
    const savedUSer = await newUser.save()

 res.status(201).json({message:`${savedUSer.userName} is registered successfully`})
    
  }
  catch (error)
  {
    res.status(500).json({error:"failed to register user"})
  }
})

//login user

app.post("/api/users/login", async (req,res) => {
  
  const {email,password} = req.body

  try {

   //email exist
    const isEmailExist = await UserModel.findOne({email})

    if (!isEmailExist)
    {
     return res.status(404).json({error:"user not found"})
    }

    if (password.length<=5)
    {
     return res.status(400).json({error:"password more then 5 latters"})
    }

    const hashedPassword = isEmailExist.password

    const isPasswordMatch = await bcrypt.compare(password, hashedPassword)

    
    if (!isPasswordMatch)
    {
       return res.status(409).json({error:"invalid credentials"}) 
    }

    const user = isEmailExist.toObject()
    delete user.password
    delete user.createdAt
    delete user.updatedAt

    token = jwt.sign({ user }, jwt_key, { expiresIn: "1h" })
    
    res.status(200).json({message:`welcome ${user.userName}`,token})
  }
  catch(error) {
     res.status(500).json({error:"failed to login"})
  }
})

//verify token

app.get("/api/users/token", jwtAuth, async (req, res) => {
  const user = req.user
  try {
    res.status(200).json({isLoggin:true,user})
  }
  catch (error)
  {
    res.status(500).json({error:error.message})
  }
})

//fetch user

app.get("/api/users", jwtAuth, async (req, res) => {
  const user = req.user
  try {
    const loggeduser = await UserModel.findById(user._id)
    
    if (!loggeduser)
    {
res.status(404).json({ error:"user not found" })
    }

     const userObj = loggeduser.toObject()
    delete userObj.password
    delete userObj.createdAt
    delete userObj.updatedAt

    res.status(200).json({ user: userObj })
  }
  catch (error)
  {
    res.status(500).json({error:"failed to get user information"})
  }
})


//wishlist

//add to wishlist

app.post('/api/products/wishlist',jwtAuth,async (req, res) => {
  const { productId } = req.body
  const {_id} = req.user

  try {

    // alredy exist in wish list

    const isAlreadyinWishlist = await WishlistModel.findOne({ productId })


    
    if (isAlreadyinWishlist)
    {
      return res.status(409).json({error:"item already in wishlist"})
    }
    const newWishlist =await new WishlistModel({ userId: _id, productId }).populate("productId")
    
 

    const savedWishlist = await newWishlist.save()
    if (!savedWishlist)
    {
return res.status(409).json({error:"error in adding wishlist in wishlist"})
    }
    res.status(201).json({message:"item added in wishlist",savedWishlist})
  }
  catch (error)
  {
res.status(500).json({error:"failed to add in wishlist"})
  }
})

//remove from wishlist

app.post('/api/products/wishlist/remove',jwtAuth,async (req, res) => {
  const { productId } = req.body

  try {

    const itemDeletedinWishlist = await WishlistModel.findOneAndDelete({productId})

    
    if (!itemDeletedinWishlist)
    {
      return res.status(400).json({error:"error in removing from wishlist"})
    }
    
    res.status(200).json({message:"item remove from wishlist",wishlistRemovedItem:itemDeletedinWishlist})
  }
  catch (error)
  {
res.status(500).json({error:"failed to remove from wishlist"})
  }
})


//fetch wishlist

app.get('/api/products/wishlist',jwtAuth,async (req, res) => {
const {_id} = req.user

  try {

    // alredy exist in wish list

    const wishlistItems = await WishlistModel.find({ userId:_id }).populate("productId")
    
    if (!wishlistItems)
    {
      return res.status(409).json({error:"error in getting wihslist items"})
    }
    if (wishlistItems.length<1)
    {
      return res.status(200).json({message:"No Items in wihslist",wishlistItems:[]})
    }
    res.status(200).json({wishlistItems})
  }
  catch (error)
  {
res.status(500).json({error:"failed to add in wishlist"})
  }
})


app.use((req,res,next) => {
  res.status(404).json({ error: "invalid api rout" })
  next()
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server is Running on Port ${PORT}`)
})