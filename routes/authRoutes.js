const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const encodeFormData = require("../helperFunctions/encodeFormData.js");
//once user logs in, reaches here

let accessToken = "";
let refreshToken = "";
let userID = "";

//user logs in
router.get("/login", async (req, res) => {
  let scope = "playlist-read-private user-library-read user-read-playback-state user-read-currently-playing user-read-email user-read-private"
  res.redirect(`https://accounts.spotify.com/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&redirect_uri=${process.env.REDIRECTURI}&scope=${scope}`);
})

//user accepts or denies the login
router.get("/logged", async (req,res) => {
  //body to be URLEncoded
  let body = {
    grant_type: "authorization_code",
    code: req.query.code,
    redirect_uri: process.env.REDIRECTURI,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET
  }
  //fetch for access and refresh token for the user 
  await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json"
    },
    body: encodeFormData(body)
  })
  .then(resp => resp.json())
  .then(data => {
    accessToken = data.access_token;
    refreshToken = data.refresh_token;
    res.json(data);
  });
})

//refresh access token 
router.get("/refreshToken", async (req,res) => {
  let urlEncodedBody = {
    grant_type: "refresh_token",
    refresh_token: refreshToken
  }
  await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": 'Basic ' + (new Buffer(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64'))
    },
    body: encodeFormData(urlEncodedBody)
  })
  .then(resp => resp.json())
  .then(data => res.json(data));
})

//gives access token for user data
router.get("/getUser", async(req,res) => {
  await fetch("https://api.spotify.com/v1/me", {
    headers: {
      "Authorization": `Bearer ${accessToken}`
    }
  })
  .then(response => response.json())
  .then(data => {
    userID = data.id;
    res.json(data);
  });
})

//get all playlists 
router.get("/playlists", async (req,res) => {
  await fetch(`https://api.spotify.com/v1/users/${userID}/playlists`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`
    }
  })
  .then(resp => resp.json())
  .then(data => res.json(data));
})

module.exports = router;