require('dotenv').config();

// Twitter API
const Twit = require('twit');
const config = require('./twitter_config');
const T = new Twit(config);

// Instagram API
const ig = require('instagram-node').instagram();
ig.use({
    client_id: process.env.client_id,
    client_secret: process.env.client_secret_id
});
ig.use({
    access_token: process.env.ig_access_token
});


// Nueral Network
const Scorer = require('./scorer');
const Network = new Scorer();

// Express, Socket.io, Mongojs and FS
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

const stream = T.stream('statuses/sample');
stream.on('tweet', tweet => {
    console.log(tweet.text);    
    if (tweet.lang == 'en' || tweet.lang == 'tl') {
        if (tweet.user.followers_count > 1000 && tweet.user.followers_count < 10000) {
            T.get('statuses/user_timeline', {
                screen_name: tweet.user.screen_name,
                count: 200,
                include_rts: false
            }, (err, tweets) => {
                io.emit('tweet', tweets);
            });
        }
    }
});

app.get('*', (req, res) => {
    res.render('404');
});

server.listen(port, () => {
    console.log(`Application is listening at port ${port}: http://localhost:${port}`);
});