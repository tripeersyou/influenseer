const synaptic = require('synaptic');
const Neuron = synaptic.Neuron;
const Layer = synaptic.Layer;
const Network = synaptic.Network;
const Trainer = synaptic.Trainer;
const Architect = synaptic.Architect;
const fs = require('fs');

class Scorer {
	constructor() {
		// INIT 
		// Layer initialization
		/**
		    Input layer takes the following:
		        1. Content Interaction Rate - [MINMAX normalization] percentage of content with interactions, e.g. likes, retweets and comments, relative to the users with the highest and lowest interaction rate.
		        2. User Engagement Rate - ratio of average likes to followers, relative to highest and lowest ratios.
		        3. Sensitive Content Rate = percentage of content flagged as sensitive.
		        4. Sharing Sentiment Grade = How positive are the retweet contents? Are they angry?
		            For each retweet - 
		            If sentiment is neutral, score as .5
		            If sentiment is polar and positive, score as 1
		            If sentiment is polar and negative, score as -1
		            Get average for all tweets
		**/
		this.input_layer = new Layer(4);
		this.hidden_layer_1 = new Layer(3);
		this.hidden_layer_2 = new Layer(4);
		this.output_layer = new Layer(1);
		// Projection Initializtions
		this.input_layer.project(this.hidden_layer_1);
		this.hidden_layer_1.project(this.hidden_layer_2);
		this.hidden_layer_2.project(this.output_layer);
		// Network Initialization
		this.network = new Network({
			input: this.input_layer,
			hidden: [this.hidden_layer_1, this.hidden_layer_2],
			output: this.output_layer
		});
		// Training Settings
		this.learning_rate = 0.1;
		this.trainer = new Trainer(this.network);

		// Intialization
		try {
			this.load_data(
				JSON.parse(fs.readFileSync('./settings.json'))
			);
		} catch (err) {
			console.log('No settings found. Training weights ...');
			this.train();
			this.save();
		}
	}

	load_data(data) {
		this.network = Network.fromJSON(data)
	}

	on_write_success() {
		console.log('settings.json');
	}

	save() {
		try {
			let out = JSON.stringify(this.network.toJSON());
			fs.writeFile('settings.json', out, this.on_write_success);
		} catch (err) {
			console.log('Cannot write file. Do you have the necessary permissions set?');
		}
	}

	train() {
		let trainingSet = [
			{
				input: [1, 1, 0, 1],
				output: [1]
			},
			{
				input: [0, 0, 1, 0],
				output: [0]
			}
		]
		this.trainer.train(trainingSet, {
			iterations: 200,
			error: 0.01,
			log: 2000
		});
	}
}

module.exports = Scorer;
