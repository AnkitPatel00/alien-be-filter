const initializeDatabase = require('./db/db.connect')
const express = require("express")
const cors = require('cors')
const ProductModel = require('./models/products.model')

const app = express()
app.use(express.json())
app.use(cors({origin:"*"}))

initializeDatabase()

app.get("/", (req,res) => {
  res.send(`<h1>Products Apis</h1>
    <p> - api/products<p>
    `)
})

app.get("/api/products", async (req, res) => {
  
  const { search, category, sortByPrice,minRating,minPrice,maxPrice,limit,skip } = req.query
  
  const sortPrice = sortByPrice ? { price: sortByPrice * 1 } : {}
  
  const pLimit = limit * 1 || 9
  const pSkip = skip*1 ||0
  
  const query = {}
  const priceQuery = {}
  
//     const searchVal =[{title : {$regex:search,$options:"i"}},
//     { description: { $regex: search, $options: "i" } }]
  

//   if (search)
//   {
//     query["$or"] = searchVal
//     priceQuery["$or"] = searchVal
//   }

//   if (category)
//   {
//     query.category = { $in: category }
//     priceQuery.category = { $in: category }
//   }
  
//   if (minRating)
//   {
//     query.rating = { $gte: minRating }
//      priceQuery.rating = { $gte: minRating }
//   }

//   if (minPrice && maxPrice)
//   {
//     query.$and = [{price:{$gte:minPrice*1}},{price:{$lte:maxPrice*1}}]
//   }
//  else if (minPrice)
//   {
//     query.price = {$gte:minPrice*1}
//   }
//   else if (maxPrice)
//   {
//     query.price = {$lte:maxPrice*1}
//   }


  try {

    const highestPrice = await ProductModel.findOne(priceQuery).sort({price:-1})
    const lowestPrice = await ProductModel.findOne(priceQuery).sort({price:1})
    const products = await ProductModel.find(query).sort(sortPrice).limit(pLimit).skip(pSkip)
    //const total = await ProductModel.find(query)
    const total = await ProductModel.countDocuments(query)

    if (!products)
    {
      res.status(400).json({error:"error in getting products"})
    }
    res.status(200).json({products:products,highestPrice:highestPrice,lowestPrice:lowestPrice,total:total})
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


const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server is Running on Port ${PORT}`)
})