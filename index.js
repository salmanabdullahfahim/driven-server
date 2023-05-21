const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();


const app = express();
const port = process.env.PORT || 5000;


//middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sjuvyra.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
    
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10
    
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection

        client.connect((err)=>{
            if(err){
                console.log(err);
                return;
            }
        })

        //collection

        const toyCollection = client.db('drivenDB').collection('toys');


        const indexKey = { toyName: 1 };
        const indexOption = { name: "nameSearch" };

        const result = await toyCollection.createIndex(indexKey, indexOption);




        // All toys

        app.get('/toys', async (req, res) => {

            const limit = parseInt(req.query.limit);

            const result = await toyCollection.find().limit(limit).toArray();
            res.send(result);
        })

      


        // search by name

        app.get('/toySearchByName/:text', async (req, res) => {

            const searchText = req.params.text;

            const result = await toyCollection.find({ toyName: { $regex: searchText, $options: "i" } }).toArray();

            res.send(result);
        })




        //filter by id

        app.get('/toys/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await toyCollection.findOne(query);
            res.send(result);
        })

        //filter by category

        app.get('/CategoryToys/:category', async (req, res) => {
            const subCategory = req.params.category;
            const result = await toyCollection.find({ category: subCategory }).toArray();
            res.send(result);

        })


        //filter by email

        app.get('/myToys', async (req, res) => {
            let query = {};

            if (req.query?.email) {
                query = {
                    sellerEmail: req.query.email
                };
            }

            const sortOption = req.query.sort;
            let sortQuery = {};

            if (sortOption === 'asc') {
                sortQuery = { price: 1 }; // Sort by price in ascending order
            } else if (sortOption === 'desc') {
                sortQuery = { price: -1 }; // Sort by price in descending order
            }

            const result = await toyCollection.find(query).sort(sortQuery).collation({ locale: "en_US", numericOrdering: true }).toArray();
            res.send(result);

        })

        //post

        app.post('/toys', async (req, res) => {
            const toy = req.body;
            const result = await toyCollection.insertOne(toy);
            res.send(result);
        })

        //update

        app.patch('/updateToy/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const toyInfo = req.body;
            const updatedToy = {
                $set: {
                    price: toyInfo.price,
                    availableQuantity: toyInfo.availableQuantity,
                    details: toyInfo.details,
                },
            };
            const result = await toyCollection.updateOne(filter, updatedToy);
            res.send(result);
        })

        //delete

        app.delete('/toys/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await toyCollection.deleteOne(query)
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




app.get('/', (req, res) => {
    res.send('driven is running');
})


app.listen(port, () => {
    console.log(`driven is running on port ${port}`)
})