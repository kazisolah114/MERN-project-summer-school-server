const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if(!authorization) {
    return res.status(401).send({error: true, message: 'unauthorized access'});
  }
  // bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if(err) {
      return res.status(401).send({error: true, message: 'unauthorized access'});
    }
    req.decoded = decoded
    next()
  }) 
}

// MongoDB Connection
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.PASSWORD_DB}@cluster0.xjdofai.mongodb.net/?retryWrites=true&w=majority`;
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
    const classCollection = client.db("summerCampSchool").collection("classes");
    const userCollection = client.db('summerCampSchool').collection("users")
    const selectedClassCollection = client.db('summerCampSchool').collection("selectedClass")
    // await client.connect();
    // Send a ping to confirm a successful connection

    // JWT apis
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({token})
    })

    // Verify Admin
    const verifyAdmin = async(req, res, next) => {
      const email = req.decoded.email;
      const query = {email: email};
      const user = await userCollection.findOne(query);
      if(user?.role !== 'admin') {
        return res.status(403).send({error: true, message: 'forbidden message'});
      }
      next()
    }
    // Verify Instructor
    const verifyInstructor = async(req, res, next) => {
      const email = req.decoded.email;
      const query = {email: email};
      const user = await userCollection.findOne(query);
      if(user?.role !== 'instructor') {
        return res.status(403).send({error: true, message: 'forbidden message'});
      }
      next()
    }
    // Verify Students
    const verifyStudent = async(req, res, next) => {
      const email = req.decoded.email;
      const query = {email: email};
      const user = await userCollection.findOne(query);
      if(user?.role !== 'student') {
        return res.status(403).send({error: true, message: 'forbidden message'});
      }
      next()
    }


    // sdsd
    // User related apsdissdfsdfsdsd
    app.post('/users', async (req, res) => {
      const user = req.body;
      // console.log(user)
      const result = await userCollection.insertOne(user);
      res.send(result)
    })
    app.get('/users', verifyJWT, verifyAdmin, async(req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result)
    })
    app.get('/instructors', async(req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result)
    })

    // Verify Role APIS
    app.get('/users/admin/:email', verifyJWT, verifyAdmin, async(req, res) => {
      const email = req.params.email;
      if(req.decoded.email !== email) {
        return res.send({admin: false})
      }
      const query = {email: email};
      const user = await userCollection.findOne(query);
      const result = {admin: user?.role !== 'admin'};
      res.send(result)
    })
    app.get('/users/instructor/:email', verifyJWT, verifyInstructor, async(req, res) => {
      const email = req.params.email;
      if(req.decoded.email !== email) {
        return res.send({instructor: false})
      }
      const query = {email: email};
      const user = await userCollection.findOne(query);
      const result = {instructor: user?.role !== 'instructor'};
      res.send(result)
    })
    app.get('/users/student/:email', verifyJWT, verifyAdmin, async(req, res) => {
      const email = req.params.email;
      if(req.decoded.email !== email) {
        return res.send({student: false})
      }
      const query = {email: email};
      const user = await userCollection.findOne(query);
      const result = {student: user?.role !== 'student'};
      res.send(result)
    })



    app.patch('/users/admin/:id', async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc)
      res.send(result)
    })
    app.patch('/users/instructor/:id', async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updateDoc = {
        $set: {
          role: 'instructor'
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    // add class into mongodb
    app.post('/addClass', async (req, res) => {
      const classInfo = req.body;
      const result = await classCollection.insertOne({...classInfo, status: 'pending'});
      // const result = await classCollection.insertOne(classInfo);
      res.send(result);
    })

    // send classes to client
    app.get('/classes', async (req, res) => {
      const cursor = classCollection.find({});
      const classes = await cursor.toArray();
      res.send(classes);
    })
    app.get('/classes/user/:id', async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const classData = await classCollection.findOne(filter);
      res.send(classData)
    })
    app.get('/classes/:id', async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const classData = await classCollection.findOne(filter);
      res.send(classData)
    })

    // Class-Status related apis
    app.patch('/classes/approve/:id', async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          status: 'approved'
        },
      };
      const result = await classCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    app.patch('/classes/deny/:id', async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          status: 'denied'
        },
      };
      const result = await classCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    // User select class
    app.post('/selectedclass', async(req, res) => {
      const item = req.body;
      const result = await selectedClassCollection.insertOne(item);
      res.send(result)
    })
    // Show selected classes in clientside
    app.get('/selectedclass', async(req, res) => {
      const cursor = selectedClassCollection.find({});
      const classes = await cursor.toArray();
      res.send(classes)
    })
    // Delete selected class
    app.delete('/selectedclass/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await selectedClassCollection.deleteOne(query);
      res.send(result)
    });
    

    
    // Class Feedback APi
    app.put('/classes/feedback/:id', async(req, res) => {
      const id = req.params.id;
      const classUpdate = req.body;
      const filter = {_id: new ObjectId(id)};
      const options = {upsert: true} 
      const updateClass = {
        $set: {
          feedback: classUpdate.feedback
        },
      };
      const result = await classCollection.updateOne(filter, updateClass, options)
      res.send(result)
    })




    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Summer Camp School Server Is Ready!')
})

app.listen(port, () => {
  console.log(`YAY, Summer Camp School Server Is Running on port ${port}`)
})