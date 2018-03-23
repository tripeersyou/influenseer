require('dotenv').config();

// Neural Network
const scorer = require('./scorer');

// Sentiment Analysis / NLP
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const speakeasy = require('speakeasy-nlp')

class facebook_evaluate {
	evaluate(posts, comments) {
		let average_angry = 0;
		let all_reactions = 0;
		let average_engagment = 0;
		let interaction_rate = 0;
		let sentiment_grade = 0;
		let is_beauty = false;
		let is_family = false;

		for (let post of posts) {
			let total_reactions = parseInt(post.follower_count) + parseInt(post.angry_count) + parseInt(post.happy_count) + parseInt(post.sad_count) + parseInt(post.laughing_count) + parseInt(post.like_count) + parseInt(post.love_count);
			average_angry += parseInt(post.follower_count) / total_reactions;
			all_reactions += total_reactions;

			if ((parseInt(post.follower_count) + parseInt(post.angry_count) + parseInt(post.happy_count) + parseInt(post.sad_count) + parseInt(post.laughing_count) + parseInt(post.like_count) + parseInt(post.love_count)) != 0) {
				interaction_rate++;
			}
		}

		for (let comment of comments) {
			sentiment_grade += speakeasy.sentiment.analyze(comment.text).score;
		}

		sentiment_grade = sentiment_grade / posts.length;

		average_angry /= posts.length;
		average_engagment = (all_reactions / parseInt(posts[0].follower_count)) / posts.length;
		interaction_rate = interaction_rate / posts.length;


		for (let post of posts) {
			if (this.beauty_tagger(tokenizer.tokenize(post.text))) {
				is_beauty = true;
				break;
			}
		}

		for (let post of posts) {
			if (this.family_tagger(tokenizer.tokenize(post.text))) {
				is_family = true;
				break;
			}
		}


		var grader = new scorer();
		return ([grader.network.activate([average_engagment, sentiment_grade, average_angry, interaction_rate])[0], is_beauty, is_family]);

	}

	beauty_tagger(text) {

		// Filter by positive
		let beauty = ['lipstick', 'make-up', 'powder', 'salon', 'facial', 'face', 'skin', 'body'];
		let is_beauty = false;
		for (var i = text.length - 1; i >= 0; i--) {
			if (beauty.includes(text[i])) {
				is_beauty = true;
				break;
			}
		}
		return is_beauty;
	}

	family_tagger(text) {
		let family = ['son', 'kids', 'brother', 'father', 'mother', 'sister', 'pamilya', 'daughter', 'love', 'care'];
		let is_family = false;
		for (var i = text.length - 1; i >= 0; i--) {
			if (family.includes(text[i])) {
				is_family = true;
				break;
			}
		}
		return is_family;

	}
}

module.exports = facebook_evaluate;