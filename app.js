require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const Twit = require('twit');
const config = require('./twitter_config');
const T = new Twit(config);
const server = require('http').Server(app)
const io = require('socket.io')(server);
const port = process.env.PORT || 80;

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

const stream = T.stream('statuses/sample', {tweet_mode: 'extended'});
stream.on('tweet', tweet => {
    if (tweet.lang == 'en' || tweet.lang == 'tl') {
        if (tweet.text.slice(0,2) != 'RT') {
            if (tweet.extended_tweet == undefined) {
                io.emit('tweet', tweet.text + ': ' + tweet.retweet_count);
                console.log('Short tweet');
            } else {
                io.emit('tweet', tweet.extended_tweet.full_text + ': ' + tweet.retweet_count);
                console.log('Long tweet');
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