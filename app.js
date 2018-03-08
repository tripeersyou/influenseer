require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const views = require('./routes/routes.js');
const port = process.env.PORT || 80;
const app = express();

// Middleware
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

// Views and assets
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routes
app.use('/', views);

app.get('*',(req, res) => {
    res.render('404');
});

app.listen(port, () => {
    console.log(`Application is listening at port ${port}: http://localhost:${port}`);
});