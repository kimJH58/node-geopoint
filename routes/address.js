const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const mysql = require('sync-mysql');
const request = require('request');
const app = express();

require('dotenv').config();

var conn = new mysql ({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PW,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  multipleStatements: true,
  dateStrings: "date",
  typeCast: function (field, next) {
      console.log(field);
      if (field.type == 'JSON') {
        return (JSON.parse(field.string()));
      }
      return next();
    },
});

const addressUtil = require("../public/javascripts/addressUtll");

router.post('/convertAddress', function(req, res){
    var address = req.body.address;
    addressUtil.convertAddress(address, result =>{
      if(result.err){
        res.status(400).json({data:result.err})
        return
      }

      res.status(200).json({data:result})
    })
});

router.post('/updateLocationText', function(req, res){
  var user_id = req.body.user_id;
  var address = req.body.address;

  addressUtil.convAndUpdateUser(user_id,address);

  res.json({data:"test"});

})

router.post('/updateAllShopLocation', function(req, res){
  
  var query = "SELECT * FROM tbl_shop";
  shops = conn.query(query);
  shops.forEach(s =>{
    addressUtil.convAndUpdateUser(s.is,s.address);
  })

  res.json({data:"disalbe"})
  return;

  var query = "SELECT * FROM tbl_shop";
  var shops = conn.query(query);

  shops.forEach(shop =>{
    var shop_id = shop.id;
    var address = shop.address;

    console.log(shop_id)
    console.log(address)

    if(address != undefined && address != "" && address != null){
      addressUtil.convAndUpdateUser(shop_id,address);
    }
  })
  res.json({data:"enable"});

})

module.exports = router;
