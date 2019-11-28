const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const encodeFormData = require("../helperFunctions/encodeFormData.js");
const querystring = require("querystring");
//once user logs in, reaches here

//user logs in
router.get("/login", async (req, res) => {
  let scope = "user-modify-playback-state user-read-playback-state user-read-currently-playing user-library-modify user-library-read playlist-read-private playlist-modify-public playlist-modify-private playlist-read-collaborative user-read-private user-read-email streaming"
  res.redirect(`https://accounts.spotify.com/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&redirect_uri=${process.env.REDIRECTURI}&scope=${scope}&show_dialog=true`);
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
    let query = querystring.stringify(data);
    res.redirect(`http://localhost:3000/${query}`)
  });
})

//refresh access token 
router.get("/refreshToken/:refreshKey", async (req,res) => {
  let urlEncodedBody = {
    grant_type: "refresh_token",
    refresh_token: req.params.refreshKey
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
router.get("/getUser/:token", async(req,res) => {
  await fetch("https://api.spotify.com/v1/me", {
    headers: {
      "Authorization": `Bearer ${req.params.token}`
    }
  })
  .then(response => response.json())
  .then(data => {
    userID = data.id;
    res.json(data);
  });
})

//get all playlists 
router.get("/playlists/:token", async (req,res) => {
  await fetch(`https://api.spotify.com/v1/me/playlists`, {
    headers: {
      "Authorization": `Bearer ${req.params.token}`
    }
  })
  .then(resp => resp.json())
  .then(data => res.json(data));
})

//get a playlist's tracks 
router.get("/playlists/tracks/:token/:playlistID", async(req,res) => {
  fetch(`https://api.spotify.com/v1/playlists/${req.params.playlistID}/tracks`, {
    headers: {
      "Authorization": `Bearer ${req.params.token}`
    }
  })
  .then(resp => resp.json())
  .then(data => res.json(data));
})

//MAKE SEARCH ENDPOINT
router.post("/search/:token", async (req,res) => {
  //split up the body so it can be encoded in the query 
  let unchangedQueryBody = req.body.message.split(" ");
  let changedQueryBody = unchangedQueryBody.join("%20");
  fetch(`https://api.spotify.com/v1/search?q=${changedQueryBody}&type=track`, {
    headers: {
      "Authorization": `Bearer ${req.params.token}`
    }
  })
  .then( resp => resp.json())
  .then( data => res.json(data));
})

module.exports = router;