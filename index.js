const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send('Summer Camp School Server Is Ready!')
})

app.listen(port, () => {
    console.log(`YAY, Summer Camp School Server Is Running on port ${port}`)
})