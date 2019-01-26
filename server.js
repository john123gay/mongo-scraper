var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

var axios = require("axios");
var cheerio = require("cheerio");

var db = require("./models");
var PORT = 3000;

var app = express();

app.use(logger("dev"));
app.use(express.urlencoded({ extended: true}));
app.use(express.json());

app.use(express.static("public"));
var MONGODB_URI = "mongodb://<dbuser>:<dbpassword>@ds161804.mlab.com:61804/heroku_1f094gqb" || "mongodb://localhost/larkings";

mongoose.connect(MONGODB_URI);
app.get("/scrape", function(req, res) {
    axios.get("https://www.technologyreview.com/the-download/").then(function(response){
        var $ = cheerio.load(response.data);
        // Now, we grab every h 2 within an article tag, and do the following:
        $("article.download__item").each(function(i, element) {
          // Save an empty result object
          var result = {};
    
          // Add the text and href of every link, and save them as properties of the result object
          result.title = $(this)
            .children("div.download__text")
            .children("h2.download__headline")
            .text();
          result.link = $(this)
          .children("div.download__text")
          .children("div.download__dek") 
          .children("p")
          .children("a")
          .attr("href");

          // .children("div.download__media-container")
           // .children("picture.feed-tz__image ")
           // .children("img.feed-tz__image ")
           // .attr("src");
           // result.link = $(this)
           // .children("a")
           // .attr("href");

    
          // Create a new Article using the `result` object built from scraping
          db.Article.create(result)
            .then(function(dbArticle) {
              // View the added result in the console
              console.log(dbArticle);
            })
            .catch(function(err) {
              // If an error occurred, log it
              console.log(err);
            });
        });
    
        // Send a message to the client
        res.redirect("/articles")
      });
    });
    
    // Route for getting all Articles from the db
    app.get("/articles", function(req, res) {
      // Grab every document in the Articles collection
      db.Article.find({})
        .then(function(dbArticle) {
          // If we were able to successfully find Articles, send them back to the client
          res.json(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          res.json(err);
        });
    });
    app.get("/notes", function(req, res) {
      db.Note.find({})
      .then(function(dbNote) {
        res.json(dbNote);
      }) 
      .catch(function(err) {
        res.json(err);
      });
    })
    
    // Route for grabbing a specific Article by id, populate it with it's note
    app.get("/articles/:id", function(req, res) {
      // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
      db.Article.findOne({ _id: req.params.id })
        // ..and populate all of the notes associated with it
        .populate("note")
        .then(function(dbArticle) {
          // If we were able to successfully find an Article with the given id, send it back to the client
          res.json(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          res.json(err);
        });
    });
    
    // Route for saving/updating an Article's associated Note
    app.post("/articles/:id", function(req, res) {
      // Create a new note and pass the req.body to the entry
      db.Note.create(req.body)
        .then(function(dbNote) {
          // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
          // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
          // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
          return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, {upsert: true},{ new: true });
        })
        .then(function(dbArticle) {
          // If we were able to successfully update an Article, send it back to the client
          res.json(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          res.json(err);
        });
    });
    app.post("/saved", function(req, res) {
      db.SaveArticle.create(req.body)
      .then(function(dbSave) {
        
        res.json(dbSave)
      })
    })
    // Start the server
    app.listen(PORT, function() {
      console.log("App running on port " + PORT + "!");
    });