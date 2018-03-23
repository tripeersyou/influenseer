require('dotenv').config();

// Neural Network
const scorer = require('./scorer.js');
// API Client
const Twit = require('twit')
const config = require('./twitter_config');
const T = new Twit(config);


// Sentiment Analysis
const speakeasy = require('speakeasy-nlp')


function evaluate(tweets, id) {
	let favourites = 0;
	let retweets = 0;
	let follow = 0;
	let posts_with_interactions = 0;
	let sensitive_content_posts = 0;
	let historical_tweets = tweets;
	let sentiment_grade = 0;

	for (let i = historical_tweets.length - 1; i >= 0; i--) {
		retweets += parseInt(historical_tweets[i]['retweet_count']);
		favourites += parseInt(historical_tweets[i]['favorite_count']);
		follow += parseInt(historical_tweets[i].user.followers_count);
		if ((parseInt(historical_tweets[i].favorite_count) > 0) || (parseInt(historical_tweets[i].retweet_count) > 0)) {
			posts_with_interactions++;
		}
		if (historical_tweets[i].possibly_sensitive) {
			sensitive_content_posts++;
		}
	}

	user_engagement_rate = (favourites + retweets) / follow;
	content_interaction_rate = (posts_with_interactions) / historical_tweets.length;
	sensitive_content_rate = sensitive_content_posts / historical_tweets.length;
	aggregate_sentiment_grade = 0;
	total_retweets = 0

	console.log(user_engagement_rate);
	console.log(content_interaction_rate);
	console.log(sensitive_content_rate);


	for (var i = historical_tweets.length - 1; i >= 0; i--) {
		T.get('statuses/retweets/:id', {
			id: historical_tweets[i].id
		}).
		then(response => {
			sentiment_grade = 0;
			for (var i = response.length - 1; i >= 0; i--) {
				aggregate_sentiment_grade += speakeasy.classify(response[i].text);
			}
		});
	}
	console.log(sentiment_grade);
	average_sentiment_grade = aggregate_sentiment_grade / total_retweets;
	let grader = new scorer();
	return grader.network.activate([content_interaction_rate, user_engagement_rate, sensitive_content_rate, average_sentiment_grade]);

}


// Returns user score and historical tweets for tagging

function batch(tweet_list) {
	const results = evaluate(tweet_list.slice);
	console.log(results);
}

function debug(historical_tweets) {
	historical_tweets = historical_tweets.slice(0, 20);
	for (var i = historical_tweets.length - 1; i >= 0; i--) {
		T.get('statuses/retweets/:id', {
			count: 100,
			id: historical_tweets[i].id_str,
		}, (err, response) => {
			sentiment_grade = 0;
			console.log(response);
		});
	}

}




// Test
var fs = require('fs')
data = JSON.parse(fs.readFileSync('data/twitter.json'));
debug(data);