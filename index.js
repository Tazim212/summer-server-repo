const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())

const varifyJWT = (req, res, next) =>{
  const authorization = req.headers.Authorization;
  if(!authorization){
    return res.status(401).send({ error: true, message: 'Unauthorized Access' })
  }
  const token = authorization.split(' ')

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
    if(err){
     return res.status(401).send({ error: true, message: 'Unauthorized Access' })
    }
    req.decoded = decoded;
    next()
  })
}

const varifyAdmin = async(req, res, next) =>{
    const email = req.decoded.email;
    const query = {email: email};
    const users = await InstructorCollection.findOne(query)
    if(users?.role !== 'admin'){
      return res.status(403).send({ error: true, message: 'forbidden message' });
    }
    next();
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tbmejyb.mongodb.net/?retryWrites=true&w=majority`;

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
    await client.connect();
    const InstructorCollection = client.db('sportAcademies').collection('instructors');
    const ClassesCollection = client.db('sportAcademies').collection('classes')
    const selectedClass = client.db('sportAcademies').collection('selectedClass')

    app.post('/jwt', async(req, res) =>{
      const users = req.body;
      const token = jwt.sign(users, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
      res.send({token})
    })



    app.get('/instructors', async(req, res) =>{
      const result = await InstructorCollection.find().toArray();
      res.send(result)
    })

    app.get('/users/admin/:email', varifyJWT, async(req, res) =>{
      const email = req.params.email;

      if(req.decoded.email !== email){
        res.send({admin: false})
      }

      const query = {email: email};
      const user = await InstructorCollection.findOne(query);
      const result = {admin: user?.role === 'admin'};
      res.send(result)
    })
    app.get('/classes', async(req, res) =>{
      const result = await ClassesCollection.find().toArray();
      res.send(result)
    })

    app.post('/dashboard/addclass', async(req, res) =>{
      const classData = req.body;
      classData.status = "pending";
      const result = await ClassesCollection.insertOne(classData);
      res.send(result)
    })

    app.get('/dashboard/myclasses', async(req, res) =>{
      const result = await ClassesCollection.find().toArray();
      res.send(result)
    })

    app.get('/dashboard/manageclasses', async(req, res)=>{
      const result = await ClassesCollection.find().toArray();
      res.send(result)
    })




    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) =>{
    res.send("Welcome to the school")
})
app.listen(port, () =>{
    console.log(`The school is running on ${port}`)
})
