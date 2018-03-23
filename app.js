require('dotenv').config();

// Twitter API
const Twit = require('twit');
const config = require('./twitter_config');
const T = new Twit(config);
const stream = T.stream('statuses/sample');

// Instagram Scraper
const ig = require('instagram-scraper');

// Nueral Network and Natural Language Processor
const Evaluator = require('./evaluate');
const eval = new Evaluator();

// Express, Socket.io, Mongojs and FS
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();

const server = require('http').Server(app)
const io = require('socket.io')(server);
const mongojs = require('mongojs');

const db = mongojs(process.env.db_uri, ['leaderboard']);
const port = process.env.PORT || 8000;
const fs = require('fs');
const csv = require('csv-parser');


// data = JSON.parse(fs.readFileSync('data/twitter_2.json'));
// console.log(eval.evaluate(data));

// Middleware
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

// Views and assets
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


stream.stop();

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/stream', (req, res) => {
    res.render('stream');
});

io.on('connection', (socket) => {
    console.log('a user connected');
    stream.start();
    socket.on('disconnect', () => {
        stream.stop();
        console.log('user disconnected');
    });
});
stream.on('tweet', tweet => {
    if ((tweet.lang == 'en' && tweet.user.location == 'Republic of the Philippines ') || tweet.lang == 'tl') {
        if (tweet.user.followers_count > 1000 && tweet.user.followers_count < 10000) {
            T.get('statuses/user_timeline', {
                screen_name: tweet.user.screen_name,
                count: 200,
                include_rts: false
            }, (err, tweets) => {
                let results = eval.evaluate(tweets)
                let entity = {
                    platform: 'twitter',
                    screen_name: tweet.user.screen_name,
                    follower_count: tweet.user.followers_count,
                    score: results[0],
                    is_beauty: results[1],
                    is_family: results[2],
                    content_interaction: results[3],
                    user_engagement: results [4],
                }
                io.emit('tweet', tweet);
                db.leaderboard.find({platform: 'twitter', screen_name: tweet.user.screen_name}, (err,docs)=>{
                    if(docs.length == 0) {
                        db.leaderboard.insert(entity,(err, res)=>{});                        
                    } else {
                        db.leaderboard.update({platform: 'twitter', screen_name: tweet.user.screen_name}, entity, (err, res)=>{});
                    }
                });
            });
        }
    }
});

app.get('/instagram', (req, res) => {
    stream.stop();
    let user = req.query.handle;
    ig.getUserData(user).then(data => {
        res.render('ig_show', {
            data: data
        });
    }).catch(data => {
        res.render('404');
    });
});

app.get('/twitter', (req, res) => {
    stream.stop();
    let user = req.query.handle;
    T.get('users/show', {
        screen_name: user
    }, (err, data) => {
        T.get('statuses/user_timeline', {
            screen_name: user,
            count: 200
        }, (err, tweets) => {
            console.log(eval.evaluate(tweets));
            res.render('twitter_show', {
                user: data,
                tweets: tweets
            });
        });
    });
});

app.get('/facebook', (req, res) => {
    stream.stop();
    let file = req.query.facebook_data;
});

// app.get('*', (req, res) => {
//     res.render('404');
// });

server.listen(port, () => {
    console.log(`Application is listening at port ${port}: http://localhost:${port}`);
});