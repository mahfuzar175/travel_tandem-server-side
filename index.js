const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ktpzdpn.mongodb.net/?retryWrites=true&w=majority`;

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
    // await client.connect();


    const serviceCollection = client.db("travelServer").collection("services")
    const serviceBookingCollection = client.db('travelServer').collection('booking');

    app.get('/services', async(req, res) =>{
        const cursor = serviceCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })

    app.post('/services', async(req, res) =>{
      const newProduct = req.body;
      console.log(newProduct);
      const result = await serviceCollection.insertOne(newProduct);
      res.send(result);
    })

    app.get('/services/:id', async(req, res) =>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await serviceCollection.findOne(query);
        res.send(result);
    })

    app.put('/services/:id', async(req, res) =>{
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



    app.delete('/services/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
  })


  // booking
  app.get('/booking', async(req, res) =>{
    const cursor = serviceBookingCollection.find();
    const result = await cursor.toArray();
    res.send(result);
})

app.post('/booking', async(req, res) =>{
  const newService = req.body;
  console.log(newService);
  const result = await serviceBookingCollection.insertOne(newService);
  res.send(result);
})

app.delete('/booking/:id', async(req, res) =>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)}
  const result = await serviceBookingCollection.deleteOne(query);
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