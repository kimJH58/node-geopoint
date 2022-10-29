const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const mysql = require('sync-mysql');
const request = require('request');
const GeoPoint = require('geopoint');
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
function convertAddress(address,callback){
    if(address == undefined || address == ""){
        callback({err:"address is wrong or empty",data: "address is wrong or empty"});
        return;
    }

    const options = {
        uri: "https://dapi.kakao.com/v2/local/search/address.json?query=" + encodeURI(address),
        json:true,
        headers: { Authorization: process.env.KAKAO_AUTH }
    };
    request(options,function(err,response,body){
      if(err){
        callback({err: err,data: err})
          return;
      }
      const documents = body["documents"];
      if(documents.length == 0){
        callback({err: "empty result",data: "empty result"})
        return;
      }
      const location = documents[0];
      var result = {
        address: location.address.address_name,
        si:location.address.region_1depth_name,
        gu:location.address.region_2depth_name,
        dong:location.address.region_3depth_name,
        lon:parseFloat(location.address.x).toFixed(6),
        lat:parseFloat(location.address.y).toFixed(6)
      }
      callback(result)
    })
}

function convAndUpdateUser(shop_id, address){
    convertAddress(address, result =>{
        if(result.err){
            console.log(result.err)
            return;
        }

        var location_str = result.lat + "," + result.lon
        var f_lat = parseFloat(result.lat);
        var f_lon = parseFloat(result.lon);
        console.log(f_lat)
        console.log(f_lon)

        var query = "UPDATE tbl_shop SET "
            query+= "lat = " + f_lat + " , ";
            query+= "lon = " + f_lon + " ";
            query+= "WHERE id = " + shop_id + " ;";

        var cart = conn.query(query);
        console.log("lat lon update success");
    })
}

function calculationGeoRange(my_lat, my_lon, distance){
    var result = new Object();
    var min_lat = distance / 88.804 / 2;
    var max_lat = distance / 88.804 / 2;

    var min_lon = distance / 111.195 / 2;
    var max_lon = distance / 111.195 / 2;

    var cMinLat = parseFloat(my_lat) - parseFloat(min_lat);
    var cMaxLat = parseFloat(my_lat) + parseFloat(max_lat);

    var cMinLon = parseFloat(my_lon) - parseFloat(min_lon);
    var cMaxLon = parseFloat(my_lon) + parseFloat(max_lon);

    result.cMinLat = cMinLat;
    result.cMaxLat = cMaxLat;
    result.cMinLon = cMinLon;
    result.cMaxLon = cMaxLon;

    return result;
}


/**
 * calcurate between two point[gps]
 * @param {*} u_lat = 요청한 유저의 lat
 * @param {*} u_lon = 요청한 유저의 lon 
 * @param {*} t_lat = 타겟의        lat 
 * @param {*} t_lon = 타겟의        lon
 * 
 * @return = some M (int)
 */
function getDistanceTwoPoint(u_lat,u_lon,t_lat,t_lon){
  point1 = new GeoPoint(Number(u_lat), Number(u_lon));
  point2 = new GeoPoint(t_lat, t_lon);
  var distance = point1.distanceTo(point2, true)
  return parseInt(distance*1000);
}

module.exports = { convertAddress , convAndUpdateUser ,calculationGeoRange, getDistanceTwoPoint};
