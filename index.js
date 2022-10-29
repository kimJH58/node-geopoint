const express = require("express");
const bodyParser = require("body-parser");

const app = express();

const addressRouter = require('./routes/address');

app.use('/address', addressRouter);

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.listen(5000,  () => {
    console.log( "Server Running at 5000 ");
})