var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var SaveArticleSchema = new Schema({
   article: {
       title: String,
       body: String,
   },
   note: {
       title: String,
       body: String
   }

});
var SaveArticle = mongoose.model("SaveArticle", SaveArticleSchema);
module.exports = SaveArticle;