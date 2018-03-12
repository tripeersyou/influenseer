var natural = require('natural'),
stemmer = natural.PorterStemmer;
var stem = stemmer.stem('stems');
console.log(stem);
stem = stemmer.stem('stemming');
console.log(stem);
stem = stemmer.stem('stemmed');
console.log(stem);
stem = stemmer.stem('stem');
console.log(stem);
stem = stemmer.stem('development');
console.log(stem);
stem = stemmer.stem('timely');
console.log(stem);