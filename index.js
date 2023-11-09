const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;


// middleware
app.use(cors({
  origin: [
    // 'http://localhost:5173'
    'https://traveltandem-995c1.web.app',
    'https://traveltandem-995c1.firebaseapp.com'
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ktpzdpn.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// middlewares
const logger = (req, res, next) => {
  console.log('log: info',req.method, req.url);
  next();
}

const verifyToken = (req, res, next) =>{
  const token = req?.cookies?.token;
  console.log('token in the middleware', token);
  // no token avilable
  if(!token){
    return res.status(401).send({message: 'unauthorized access'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
    if(err){
      return res.status(401).send({message: 'unauthorized access'})
    }
    req.user = decoded;
    next();
  })
  
}



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();


    const serviceCollection = client.db("travelServer").collection("services")
    const serviceBookingCollection = client.db('travelServer').collection('booking');
    const pendingBookingCollection = client.db('travelServer').collection('pending');

    // auth related api
    app.post('/jwt', async(req,res) => {
      const user = req.body;
      console.log('user for token', user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" ? true: false,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      })
      .send({success: true});
    })

    app.post('/logout', async(req, res) => {
      const user = req.body;
      console.log('logged out', user);
      res.clearCookie('token', {maxAge: 0,secure: process.env.NODE_ENV === "production" ? true: false, sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",}).send({success: true})
    })



    // servics related api
    app.get('/services', logger, async(req, res) =>{
        const cursor = serviceCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })

    app.post('/services',  logger, async(req, res) =>{
      const newProduct = req.body;
      console.log(newProduct);
      const result = await serviceCollection.insertOne(newProduct);
      res.send(result);
    })

    app.get('/services/:id', verifyToken, logger, async(req, res) =>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await serviceCollection.findOne(query);
        res.send(result);
    })

    app.put('/services/:id', logger, async(req, res) =>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const options = {upsert: true};
      const updatedService = req.body;
      const service = {
        $set: {
          serviceName: updatedService.serviceName,
          serviceDescription: updatedService.serviceDescription,
          serviceImage: updatedService.serviceImage,
          servicePrice: updatedService.servicePrice,
          serviceArea: updatedService.serviceArea,
        }
      }
      const result = await serviceCollection.updateOne(filter, service, options);
      res.send(result);
  })



    app.delete('/services/:id',  logger, async(req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
  })


  // booking
  app.get('/booking', logger, async(req, res) =>{
    const cursor = serviceBookingCollection.find();
    const result = await cursor.toArray();
    res.send(result);
})

app.post('/booking', logger, async(req, res) =>{
  const newService = req.body;
  console.log(newService);
  const result = await serviceBookingCollection.insertOne(newService);
  res.send(result);
})

app.delete('/booking/:id', logger,  async(req, res) =>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)}
  const result = await serviceBookingCollection.deleteOne(query);
  res.send(result);
})


// pending
app.get('/pending', logger, async(req, res) =>{
  const cursor = pendingBookingCollection.find();
  const result = await cursor.toArray();
  res.send(result);
})

app.post('/pending', logger, async(req, res) =>{
  const newService = req.body;
  console.log(newService);
  const result = await pendingBookingCollection.insertOne(newService);
  res.send(result);
})



    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Travel Server is running')
})

app.listen(port, () =>{
    console.log(`Travel Server is running on port:${port}`);
})