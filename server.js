var fs = require('fs');
var path = require('path');
var express = require('express');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var people = require('./people');
var app = express();
var port = process.env.PORT || 3000;

/*
 * Do some preprocessing on our data to make special note of people 65 or
 * older.
 */
Object.keys(people).forEach(function (person) {
  if (people[person].age >= 65) {
    people[person].is65OrOlder = true;
  }
});

/*
 * Set up Express to use express-handlebars as the view engine.  This means
 * that when you call res.render('page'), Express will look in `views/` for a
 * file named `page` (express-handlebars will recognize the .handlebars
 * extension), and it will use express-handlebars to render the content of that
 * file into HTML.
 *
 * Here, we're also setting express-handlebars to use 'main' as the default
 * layout.  This means that, if we can res.render('page'), express-handlebars
 * will take the content from `views/page.handlebars` and plug it into the
 * {{{body}}} placeholder in `views/layouts/main.handlebars`.
 */
app.engine('handlebars', exphbs({ defaultLayout: 'main' }))
app.set('view engine', 'handlebars');

// Parse all request bodies as JSON.
app.use(bodyParser.json());

// Serve static files from public/.
app.use(express.static(path.join(__dirname, 'public')));

// Render the index page for the root URL path ('/').
app.get('/', function (req, res) {
  res.render('index-page', {
    pageTitle: 'Welcome!'
  });
});

/*
 * Render the people page for the URL path '/people'.  Pass our people data
 * to Handlebars to use in filling out the page template.
 */
app.get('/people', function (req, res) {
  res.render('people-page', {
    pageTitle: 'Famous People',
    people: people
  });
});

/*
 * Use a dynamic route to render a page for each individual person.  Provide
 * that person's data to Handlebars so it can fill out the template.
 */
app.get('/people/:person', function (req, res, next) {

  var person = people[req.params.person];

  if (person) {

    res.render('person-page', {
      pageTitle: person.name,
      person: person
    });

  } else {

    // If we don't have info for the requested person, fall through to a 404.
    next();

  }

});

app.post('/people/:person/add-photo', function (req, res, next) {

  var person = people[req.params.person];

  if (person) {

    /*
     * If the POST body contains a photo URL, then add the new photo to the
     * person's photos and respond with success.  Otherweise, let the client
     * know they made a bad request.
     */
    if (req.body && req.body.url) {
      person.photos = person.photos || [];
      person.photos.push({
        url: req.body.url,
        caption: req.body.caption
      });
      res.status(200).send();
    } else {
      res.status(400).send("Person photo must have a URL.");
    }

  } else {

    // If we don't have info for the requested person, fall through to a 404.
    next();

  }

});

// If we didn't find the requested resource, send a 404 error.
app.get('*', function(req, res) {
  res.status(404).render('404-page', {
    pageTitle: '404'
  });
});

// Listen on the specified port.
app.listen(port, function () {
  console.log("== Listening on port", port);
});
