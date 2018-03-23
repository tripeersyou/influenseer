require('dotenv').config();

// Neural Network
const scorer = require('./scorer');

// Sentiment Analysis / NLP
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const speakeasy = require('speakeasy-nlp')

class instagram_evaluater {
	evaluate(posts) {
		let user = posts.graphql.user;
		let follower_count = parseInt(user.edge_followed_by.count);
		let posts_timeline = user.edge_owner_to_timeline_media.edges;
		let mean_user_engagement_rate = 0;
		let sum_engagement = 0;
		let posts_with_interactions = 0;
		let comments_disabled_count = 0;
		let date = Math.round((new Date()).getTime() / 1000);
		let gap = 0;
		let is_beauty = false;
		let is_family = false;
		let gaps = [];
		for (let posts of posts_timeline) {
			sum_engagement += parseInt(posts.node.edge_liked_by.count);

			if (parseInt(posts.node.edge_liked_by.count) < 0) {
				if (parseInt(posts.node.edge_media_to_comment.count > 0)) {
					posts_with_interactions++;
				}
			} else {
				posts_with_interactions++;
			}

			if (posts.node.comments_disabled == 'true') {
				comments_disabled_count++;
			}
			gap += date - parseInt(posts.node.taken_at_timestamp);
			gaps.push(gap);
			date = parseInt(posts.node.taken_at_timestamp);
		}

		for (posts of posts_timeline) {
			for (let node of posts.node.edge_media_to_caption.edges) {
				if (this.beauty_tagger(tokenizer.tokenize(node.node.text))) {
					is_beauty = true;
					break;
				}
			}
		}

		for (posts of posts_timeline) {
			for (let node of posts.node.edge_media_to_caption.edges) {
				if (this.family_tagger(tokenizer.tokenize(node.node.text))) {
					is_family = true;
					break;
				}
			}
		}
		mean_user_engagement_rate = (sum_engagement / follower_count) / posts_timeline.length;
		let interaction_rate = posts_with_interactions / posts_timeline.length;
		let comments_disabled_rate = comments_disabled_count / posts_timeline.length;
		let gap_grade = 7 / (gap / posts_timeline.length);


		let grade = new scorer();

		return ([grade.network.activate([parseFloat(mean_user_engagement_rate), parseFloat(interaction_rate), parseFloat(comments_disabled_rate), parseFloat(gap_grade)])[0], is_beauty, is_family]);

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

	timeConverter(UNIX_timestamp) {
		var a = new Date(UNIX_timestamp * 1000);
		var months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
		var year = a.getFullYear();
		var month = months[a.getMonth()];
		var date = a.getDate();
		var hour = a.getHours();
		var min = a.getMinutes();
		var sec = a.getSeconds();
		var time = date + '/' + month + '/' + year + ' ' + hour + ':' + min + ':' + sec;
		return new Date(time);
	}
}

module.exports = instagram_evaluater;