// Neural Network
const scorer = require('./scorer.js');

// Test
// var fs = require('fs')
// data = 	JSON.parse(fs.readFileSync('sample.json'));

// API Client
const twit = require('twit')
const config = require('./twitter_config');
const T = new Twit(config);


// Sentiment Analysis
const speakeasy = require('speakeasy-nlp')

// Returns user score and historical tweets for tagging
function score_user(user_tweet, current_maximum_engagement_rate, current_maximum_interaction_rate) {
	var candidate = user_tweet.user;
	// Removes users with too many/too few users i.e. NOT microinfluencers
	if ((candidate.followers_count > 1000) && (candidate.followers_count < 10000)) {

		// Var initialization 
		let target = candidate.screen_name;
		let favourites = 0;
		let retweets = 0;
		let follow = 0;
		let posts_with_interactions = 0;
		let sensitive_content_posts = 0;
		let historical_tweets = '';

		// Async query for historical tweets
		T.get('statuses/user_timeline', {
			screen_name: target,
			count: 200
		}).then(response => {
			historical_tweets = JSON.parse(response);
		});

		for (let i = historical_tweets.length - 1; i >= 0; i--) {
			retweets += historical_tweets[i]['retweet_count'];
			favourites += historical_tweets[i]['favorite_count'];
			follow += historical_tweets[i].user.followers_count;
			if ((historical_tweets[i].favorite_count > 0) || (historical_tweets[i].retweet_count > 0)) {
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
		if (user_engagement_rate > 0.02) {
			for (var i = historical_tweets.length - 1; i >= 0; i--) {
				T.get('statuses/retweets/:id', {
					id: historical_tweets[i].id
				}).
				then(response => {
					sentiment_grade = 0;
					for (var i = response.length - 1; i >= 0; i--) {
						aggregate_sentiment_grade += speakeasy.classify(response[i].text);
					}
					total_retweets += response.length;
				});
			}
			average_sentiment_grade = aggregate_sentiment_grade / total_retweets;
			let grader = new scorer();
			return [grader.network.activate([content_interaction_rate, user_engagement_rate, sensitive_content_rate, average_sentiment_grade]), historical_tweets];
		} else {
			return 'Unqualified';
		}
	} else {
		return 'Unqualified';
	}
}


async function batch_async(tweet_list) {
	const promises = tweet_list.map(score_user)
	results = await Promise.all(promises);
	for (var i = results.length - 1; i >= 0; i--) {
		if (results[i].length > 1) {
			tag_results(results[i]);
		}
	}
}

// Test
// batch_async(data);
