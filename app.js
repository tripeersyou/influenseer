require('dotenv').config();

// Twitter API
const Twit = require('twit');
const config = require('./twitter_config');
const T = new Twit(config);

// Instagram Scraper
const ig = require('instagram-scraper');

// Nueral Network and Natural Language Processor
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



// Middleware
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

// Views and assets
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// ig.getUserData('jiggyvillanueva').then( data => {
//     let user = JSON.stringify(data);
//     console.log(user);
//     fs.writeFile('data/user.json', user);
// });

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

const stream = T.stream('statuses/sample');
stream.on('tweet', tweet => {
    if ((tweet.lang == 'en' && tweet.user.location == 'Republic of the Philippines ') || tweet.lang == 'tl') {
        if (tweet.user.followers_count > 1000 && tweet.user.followers_count < 10000) {
            console.log(tweet.text);
            T.get('statuses/user_timeline', {screen_name: tweet.user.screen_name,count: 200,include_rts: false}, (err, tweets) => {
                io.emit('tweet', tweets);
            });
        }
    }
});

app.get('/instagram/:handle', (req, res) => {
	let user = req.params.handle;
	ig.getUserData(user, (err, data) => {
		res.render('ig/show', {data: data});
	});
});


app.get('*', (req, res) => {
    res.render('404');
});

server.listen(port, () => {
    console.log(`Application is listening at port ${port}: http://localhost:${port}`);
});
