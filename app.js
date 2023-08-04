//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose
  .connect(
    "mongodb+srv://admin-ishaan:poiuy098@cluster0.tghmzwn.mongodb.net/todolistDB",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Connected to the database");
  })
  .catch((error) => {
    console.error("Error connecting to the database:", error);
  });

// Define a schema for your data
const itemsSchema = new mongoose.Schema({
  name: String,
});

// Create a model based on the schema
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Task1",
});

const item2 = new Item({
  name: "Task2",
});

const item3 = new Item({
  name: "Task3",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

/* Item.insertMany(defaultItems)
  .then(() => {
    console.log("Default items saved successfully");
  })
  .catch((error) => {
    console.error("Error saving default items:", error);
  }); */

app.get("/", function (req, res) {
  Item.find({})
    .then((foundItems) => {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(() => {
            console.log("Default items saved successfully");
          })
          .catch((error) => {
            console.error("Error saving default items:", error);
          });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    })
    .catch((error) => {
      console.error("Error finding fruits:", error);
    });
});

app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  // Find the list by name
  const foundList = await List.findOne({ name: customListName });

  if (foundList) {
    // The list exists, show it
    res.render("list", {
      listTitle: foundList.name,
      newListItems: foundList.items,
    });
  } else {
    // The list doesn't exist, create it
    const list = new List({
      name: customListName,
      items: defaultItems,
    });
    list.save();

    // Redirect to the new list
    res.redirect("/" + customListName);
  }
});

app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    const foundList = await List.findOne({ name: listName });
    foundList.items.push(item);
    await foundList.save();
    res.redirect("/" + listName);
  }
});

app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    try {
      await Item.findByIdAndRemove(checkedItemId);
      console.log("Successfully deleted item");
      res.redirect("/");
    } catch (err) {
      console.log("Error deleting item:", err);
      res.status(500).send("Error deleting item");
    }
  } else {
    const foundList = await List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      {
        exec: true,
      }
    );
    if (!foundList.err) {
      res.redirect("/" + listName);
    }
  }
});

app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
