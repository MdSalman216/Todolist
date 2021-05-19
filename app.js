const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash"); 


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

// Connect with MongoDB localhost:27017
// mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});

// Connect with MongoDB Atlas
mongoose.connect("mongodb+srv://admin-salman:test786@cluster0.hnnuv.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});
// test786 : PASSWORD
// todolistDB : Database Name

// Define Schema
const itemsSchema = {
  name :  String
};

// Create a Model
const Item = mongoose.model("Item", itemsSchema);

// Create some default documents
const item1 = new Item({
  name : "Welcome !"
});
const item2 = new Item({
  name : "Hit + botton to add new item."
});
const item3 = new Item({
  name : "<-- hit this to delete an item. "
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name : String,
  items : [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {
  // Read the default documents
  Item.find({}, function(err, foundItems){
    if(foundItems.length === 0)
    {
      // Inserting default documents into DB
      Item.insertMany(defaultItems, function(err){
        if(err)
          console.log(err);
        else
          console.log("Successfully inserted default documents into DB.");
      });
      res.redirect("/");
    }
    else
      res.render("list", {listTitle: "Today", newListItems: foundItems }); 
  });

});

// Express route Parameters for Dynamic Route
app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, i){
    if(!err){
      if(!i)
      {
        // create a new list
        const list = new List({
          name : customListName,
          items : defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      }
      else
      {
        // Show an existing list
        res.render("list", {listTitle: i.name, newListItems: i.items });
      }    
    }
  }); // findOne()
   
}); //app.get()



app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({
    name : itemName
  });

  if (listName === "Today")
  {
    item.save();
    res.redirect("/");
  }
  else
  {
    List.findOne({name:listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});



app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today") 
  {
    // delete document from "items" collection
    Item.deleteOne({_id : checkedItemId}, function(err){
      if(err)
        console.log(err);
      else
        console.log("Deleted Successfully");

      res.redirect("/");
    });
  }
  else
  {
      // delete document from "lists" collection
      // $pull : mongodb command to delete document from an array
      List.findOneAndUpdate( {name:listName}, {$pull : {items: {_id:checkedItemId} }}, function(err, foundList){
        if(!err)
          res.redirect("/" + listName);
      });
  }

  
});



app.get("/about", function(req, res){
  res.render("about");
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started Successfully");
});
