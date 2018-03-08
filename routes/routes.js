const express = require('express');
const Twit = require('twit');
const config = require('../twitter_config');
const router = express.Router();
const TwitAPI = new Twit(config);
const TwitStream = TwitAPI.stream('statuses/sample');
// const mongojs = require('mongojs');
// const db = mongojs(process.env.db_uri, ['tweets']);
const tweets = [];

router.get('/', (req, res) => {
    res.render('index');
});

module.exports = router;