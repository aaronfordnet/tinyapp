"use strict";

const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");

app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({extended: true}));
app.use("/assets",express.static(__dirname + "/assets"));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "Hy7W2r": "http://www.amazon.com",
};

app.get("/urls", (req, res) => {
  res.render("urls_index", {
    urls: urlDatabase
  });
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  // Create new short URL id and add to database
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  // Respond with redirect to shortened URL's page
  res.redirect(`/urls/${shortURL}`);
});

// DELETE URL
app.post("/urls/:id/delete", (req, res) => {

  let deleteId = req.params.id;
  console.log(deleteId);
  console.log(req);

  delete urlDatabase[deleteId];
  res.redirect(`../`)
});


app.get("/urls/:id", (req, res) => {
  res.render("urls_show", {
    shortURL: req.params.id,
    urls: urlDatabase
  });
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];

  // Check urlDatabase for valid url id
  for (let urls in urlDatabase) {
    if (urls === shortURL) {
      res.redirect(302, longURL);
    }
  }

  // Throw error if no valid url id exists
  // Can't set headers after they are sent error
  res.send("Error - TinyUrl not found");
});

// GENERATE RANDOM URL ID
function generateRandomString() {
  let id = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    id += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return id;
}

// LISTEN ON PORT 8080
app.listen(PORT, () => {
  console.log(`TinyApp listening on localhost:${PORT}`);
});
