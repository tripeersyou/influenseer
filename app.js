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

const IgEvaluator = require('./instagram_evaluate');
const ig_eval = new IgEvaluator();

const FbEvaluator = require('./facebook_evaluate');
const fb_eval = new FbEvaluator();

// Express, Socket.io, Mongojs and FS
const express = require('express');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();

const server = require('http').Server(app)
const io = require('socket.io')(server);
const mongojs = require('mongojs');

const db = mongojs(process.env.db_uri, ['leaderboard']);
const port = process.env.PORT || 8000;
const fs = require('fs');
const csvtojson = require('csvtojson');
// Middleware
app.use(fileUpload());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

// Views and assets
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    stream.stop();
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
                    is_family: results[2]
                };
                io.emit('tweet', tweet);
                console.log('Requested');
                db.leaderboard.find({
                    platform: 'twitter',
                    screen_name: tweet.user.screen_name
                }, (err, docs) => {
                    if (docs.length == 0) {
                        db.leaderboard.insert(entity, (err, res) => {});
                    } else {
                        db.leaderboard.update({
                            platform: 'twitter',
                            screen_name: tweet.user.screen_name
                        }, entity, (err, res) => {});
                    }
                });
            });
        }
    }
});

app.get('/instagram', (req, res) => {
    stream.stop();
    let user = req.query.handle;
    if (user == undefined) {
        res.send('No username given.')
    }
    ig.getUserData(user).then(data => {
        if (data.graphql.user.edge_owner_to_timeline_media.edges.length > 0) {
            let results = ig_eval.evaluate(data);
            let entity = {
                platform: 'instagram',
                screen_name: data.graphql.user.username,
                follower_count: data.graphql.user.edge_followed_by.count,
                score: results[0],
                is_beauty: results[1],
                is_family: results[2]
            };
            db.leaderboard.find({
                platform: 'instagram',
                screen_name: data.graphql.user.username
            }, (err, docs) => {
                if (docs.length == 0) {
                    db.leaderboard.insert(entity, (err, res) => {});
                } else {
                    db.leaderboard.update({
                        platform: 'instagram',
                        screen_name: data.graphql.user.username
                    }, entity, (err, res) => {});
                }
            });
            res.render('ig_show', {
                data: data,
                score: results[0]
            });
        } else {
            res.render('404');
        }
    }).catch(data => {
        console.log(data);
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
            if (tweets.error) {
                res.render('404');
            } else {
                let results = eval.evaluate(tweets);
                console.log(results)
                let entity = {
                    platform: 'twitter',
                    screen_name: user,
                    follower_count: data.followers_count,
                    score: results[0],
                    is_beauty: results[1],
                    is_family: results[2]
                };
                db.leaderboard.find({
                    platform: 'twitter',
                    screen_name: user
                }, (err, docs) => {
                    if (docs.length == 0) {
                        db.leaderboard.insert(entity, (err, res) => {});
                    } else {
                        db.leaderboard.update({
                            platform: 'twitter',
                            screen_name: user
                        }, entity, (err, res) => {});
                    }
                });
                res.render('twitter_show', {
                    user: data,
                    tweets: tweets,
                    score: results[0]
                });
            }
        });
    });
});

app.get('/facebook', (req,res,next)=>{
    res.redirect('/');
});

app.post('/facebook', (req, res, next) => {
    stream.stop();
    let file = req.files.facebook_data;
    let file2 = req.files.facebook_data;
    file.mv('uploads/data.csv', function(err){ if (err) { console.log(err); }});
    file2.mv('uploads/data2.csv', function(err){ if (err) { console.log(err); }});
    let posts = [];
    let comments = [];
    let result;
    csvtojson().fromFile('uploads/data.csv').on('json',(jsonObj)=>{
        posts.push(jsonObj);
        csvtojson().fromFile('uploads/data2.csv').on('json',(jsonObj)=>{
            comments.push(jsonObj);
            
        }).on('done',(error)=>{
        });
    }).on('done',(error)=>{
        result = fb_eval.evaluate(posts,comments);
        let entity = {
            platform: 'facebook',
            screen_name: req.body.username,
            follower_count: posts[0].follower_count,
            score: result[0],
            is_beauty: result[1],
            is_family: result[2]
        };
        db.leaderboard.find({
            platform: 'facebook',
            screen_name: req.body.username
        }, (err, docs) => {
            if (docs.length == 0) {
                db.leaderboard.insert(entity, (err, res) => {});
            } else {
                db.leaderboard.update({
                    platform: 'facebook',
                    screen_name: req.body.username
                }, entity, (err, res) => {});
            }
        });
        res.render('facebook_show', {posts: posts, score: result[0], username: req.body.username,follower_count: posts[0].follower_count});
    });
});

app.get('/leaderboards', (req, res)=>{
    stream.stop();
    if (req.query.show) {
        db.leaderboard.find({platform: req.query.show}).sort({score: -1},(err,docs)=>{
            res.render('leaderboard', {
                influencers: docs
            });
        });
    } else {
        db.leaderboard.find().sort({score: -1},(err,docs)=>{
            res.render('leaderboard', {
                influencers: docs
            });
        });
    }
});

// app.get('*', (req, res) => {
//     res.render('404');
// });

server.listen(port, () => {
    console.log(`Application is listening at port ${port}: http://localhost:${port}`);
});