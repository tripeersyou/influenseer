require('dotenv').config();

// Twitter API
const Twit = require('twit');
const config = require('./twitter_config');
const T = new Twit(config);

// Instagram API
const ig = require('instagram-node').instagram();
ig.use({client_id: process.env.client_id, client_secret: process.env.client_secret_id});
ig.use({access_token: process.env.ig_access_token});

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const server = require('http').Server(app)
const io = require('socket.io')(server);
const mongojs = require('mongojs');
const db = mongojs(process.env.db_uri, ['tweets']);
const port = process.env.PORT || 8000;
const fs = require('fs');

// ig.user_search('tripeersyou', function(err, users, remaining, limit) {
//     if (err) {throw err; }
//     console.log(users);
// });

// Middleware
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

// Views and assets
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
});

const stream = T.stream('statuses/sample', {});
stream.on('tweet', tweet => {
    if ((tweet.lang == 'en' && tweet.user.location === 'Philippines') || tweet.lang == 'tl' ) {
        if (tweet.text.slice(0,2) != 'RT') {
            if (tweet.extended_tweet == undefined) {
                if(tweet.user.followers_count > 1000 && tweet.user.followers_count < 10000) {
                    T.get('statuses/user_timeline', {screen_name: tweet.user.screen_name, count: 200}, (err, tweets)=>{
                        tweets.forEach((user_tweet)=>{
                            io.emit('tweet', tweet.user.screen_name+ ': ' +user_tweet.text + ': ' + user_tweet.retweet_count + ' favorites.');
                        });
                    });
                }
            } else {
                if(tweet.user.followers_count > 1000 && tweet.user.followers_count < 10000) {
                    T.get('statuses/user_timeline', {screen_name: tweet.user.screen_name, count: 200}, (err, tweets)=>{
                        for(let user_tweet in tweets) {
                            io.emit('tweet', tweet.user.screen_name+ ': ' +user_tweet.extended_tweet.full_text + ': ' + user_tweet.retweet_count + ' favorites.');
                        }
                    });
                }
            }
        }
    }
});

app.get('*', (req, res) => {
    res.render('404');
});

server.listen(port, () => {
    console.log(`Application is listening at port ${port}: http://localhost:${port}`);
});