 
const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors"); 
require("dotenv").config();
const jwt = require('jsonwebtoken');

//Middlewair
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}


const { MongoClient , ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_pass}@cluster0.bfdmw9d.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    const courseCollection=client.db("LanguageMasterDB").collection("courses")
    const usersCollection=client.db("LanguageMasterDB").collection("users")
    const cartCollection=client.db("LanguageMasterDB").collection("selectedClasses")


    //verify Admin and Instructor ==============================
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }
    const verifyInstructor = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'instructor') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }
//==============================================================
    
app.post("/course",async(req,res)=>{
  const course=req.body
  const result=await courseCollection.insertOne(course)
  res.send(result)
})

    app.get("/courses", async(req,res)=>{
        const result=await courseCollection.find().toArray(); 
        res.send(result);
    }) 

    // cart
     app.post("/cart",async(req,res)=>{
      const selectedCourse=req.body; 
      const result=await cartCollection.insertOne(selectedCourse)  
      res.send(result)
     }) 
     
     app.get("/cart",async(req,res)=>{
      const result=await cartCollection.find().toArray()
      res.send(result)
     })


      app.patch('/course/status/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const update=req.body;
      console.log(update);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status:`${update.status}`
        },
      };

      const result = await courseCollection.updateOne(filter, updateDoc);
      res.send(result);

    })
    
    app.post("/jwt",(req,res)=>{
      const user=req.body;
      // console.log(user);
      const token=jwt.sign(user,process.env.ACCESS_TOKEN,{ expiresIn: '10h' })
      res.send({token})
    })

    app.post('/users', async (req, res) => {
      const user = req.body;
      console.log(user);
      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists' })
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
   
    app.get("/users",async(req,res)=>{
      const result=await usersCollection.find().toArray()
      res.send(result)
    })

    // app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
    //   const result = await usersCollection.find().toArray();
    //   res.send(result);
    // });
    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email; 
      console.log(email);

      // if (req.decoded.email !== email) {
      //   res.send({ admin: false })
      // }

      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === 'admin' }
      res.send(result);
    })

    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);

    })

    app.get('/users/instructor/:email', async (req, res) => {
      const email = req.params.email; 
      console.log(email);

      // if (req.decoded.email !== email) {
      //   res.send({ admin: false })
      // }

      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === 'instructor' }
      res.send(result);
    }) 

    app.patch('/users/instructor/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'instructor'
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);

    })
    app.get("/user/instructor",async(req,res)=>{
      const role = 'instructor';
      const instructor=await usersCollection.find({role:role}).toArray()
      res.send(instructor)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Language Master is Running')
  })
  
  app.listen(port, () => {
    console.log(`Language Master on port ${port}`)
  })