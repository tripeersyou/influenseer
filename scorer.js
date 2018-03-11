var synaptic = require('synaptic');
var Neuron = synaptic.Neuron,
	Layer = synaptic.Layer,
	Network = synaptic.Network,
	Trainer = synaptic.Trainer,
	Architect = synaptic.Architect;
var fs = require('fs')

function scorer() {
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
	// Projection Initializations
	this.input_layer.project(this.hidden_layer_1);
	this.hidden_layer_1.project(this.hidden_layer_2);
	this.hidden_layer_2.project(this.output_layer);
	// Network Initalization
	this.network = new Network({
		input: this.input_layer,
		hidden: [this.hidden_layer_1,this.hidden_layer_2],
		output: this.output_layer
	});
	// Training Settings
	this.learning_rate = 0.2;
	this.trainer = new Trainer(this.network);

	// Functions 
	this.load_data = function (data) {
		this.network = Network.fromJSON(data);
	};

	this.on_write_success = function () {
		console.log('Wrote settings to - nn_settings.json');
	}

	this.save = function () {
		try{
			out = JSON.stringify(this.network.toJSON());
			fs.writeFile('nn_settings.json',out,this.on_write_success);
		}
		catch(err){
			console.log('Cannot write file. Do you have the necessary permissions set?');
		}
	}

	this.train = function(){
		var trainingSet = [
		  {
		    input: [1,1,0,1],
		    output: [1]
		  },
		  {
		    input: [0,0,1,0],
		    output: [0]
		  }
		]
		this.trainer.train(trainingSet,{
			iterations : 2000,
			error : 0.01,
			log:200
		})
	};

	// Initialization 
	try{
		this.load_data(
			JSON.parse(fs.readFileSync('nn_settings.json'))
		);
	}
	catch(err){
		console.log('No settings found. Training weights ...');
		this.train();
		this.save();
	}

}

x = new scorer();
console.log(x.network.activate([0.7,0.5,0.9,0.9]));
console.log(x.network.activate([0.2,0.1,0.6,0.3]));
console.log(x.network.activate([0.5,0.5,0.5,0.4]));
console.log(x.network.activate([0.6,0.4,0.1,0.6]));
console.log(x.network.activate([1,1,0,1]));
console.log(x.network.activate([1,0.1,0,0.9]));

x.save()