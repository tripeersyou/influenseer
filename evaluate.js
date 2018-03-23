require('dotenv').config();

// Neural Network
const scorer = require('./scorer.js');
// API Client
const Twit = require('twit')
const config = require('./twitter_config');
const T = new Twit(config);

// Sentiment Analysis / NLP
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const speakeasy = require('speakeasy-nlp')

class evaluater{
	evaluate(tweets, id, max_user_engagement = 1, min_user_engagement = 0, max_content_interaction = 1, min_content_interaction = 0) {
		let favourites = 0;
		let retweets = 0;
		let follow = 0;
		let posts_with_interactions = 0;
		let sensitive_content_posts = 0;
		let is_beauty = false;
		let is_family = false;
		let historical_tweets = tweets;
		let sentiment_grade = 0;
		let user_engagement_rate = 0;
		let sensitive_content_rate = 0;
		let content_interaction_rate = 0;
		let aggregate_sentiment_grade = 0;
		let total_retweets = 0
		let average_sentiment_grade = 0;
		let tokenizer = new natural.TreebankWordTokenizer();


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

		for (let i = historical_tweets.length - 1; i >= 0; i--) {
			T.get('statuses/retweets/:id', {
				id: historical_tweets[i].id_str
			},(err,response) => {
				sentiment_grade = 0;
<<<<<<< HEAD
				for (let j = response.length - 1; j >= 0; j--) {
=======
				// console.log(response);
				for (let j = response.length - 1; j >= 0; j--) {
					// console.log(response[j].text);
>>>>>>> e265abeb3dbbe0a2a515307a2364b6eb2d2c5f4b
					aggregate_sentiment_grade += speakeasy.classify(response[j].full_text);
				}
			});
		}

		average_sentiment_grade = aggregate_sentiment_grade / total_retweets;


		for (let tweet of historical_tweets){ 
			let text = tokenizer.tokenize(tweet.text);
			if(this.beauty_tagger(text)){
				is_beauty = true;
				break;
			}
		}

		for (let tweet of historical_tweets){ 
			let text = tokenizer.tokenize(tweet.text);
			if(this.family_tagger(text)){
				is_family = true;
				break;
			}
		}

		let grader = new scorer();
		let normalized_content_interaction_rate = (content_interaction_rate - min_content_interaction)/max_content_interaction;
		let normalized_user_engagement_rate = (user_engagement_rate - min_user_engagement)/max_user_engagement;
		return [grader.network.activate([normalized_content_interaction_rate, normalized_user_engagement_rate, sensitive_content_rate, aggregate_sentiment_grade])[0],is_beauty,is_family,content_interaction_rate,user_engagement_rate];
	}

	beauty_tagger(text) {

		// Filter by positive
		let beauty = ['lipstick','make-up','powder','salon','facial','face','skin','body'];
		let is_beauty = false;
		for (var i = text.length - 1; i >= 0; i--) {
			if(beauty.includes(text[i])){
				is_beauty =  true;
				break;
			}
		}
		return is_beauty;
	}

	family_tagger(text){
		let family = ['son','kids','brother','father','mother','sister','pamilya','daughter','love','care'];
		let is_family = false;
		for (var i = text.length - 1; i >= 0; i--) {
			if(family.includes(text[i])){
				is_family =  true;
				break;
			}
		}
		return is_family;

	}

	debug(historical_tweets) {
		historical_tweets = historical_tweets.slice(0, 20);
		for (var i = historical_tweets.length - 1; i >= 0; i--) {
			tagger(historical_tweets[i])
		}
		for (var i = historical_tweets.length - 1; i >= 0; i--) {
			T.get('statuses/retweets/:id', {
				count: 100,
				id: historical_tweets[i].id_str,
			}, (err, response) => {
				sentiment_grade = 0;
				// console.log(response);
			});
		}

	}
}
