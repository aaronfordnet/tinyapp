"use strict";

/*  ===========
    SETUP
============= */

const express = require("express");
const app = express();
const port = 8080; // default port 8080
const bodyParser = require("body-parser");

app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({extended: true}));
app.use("/assets",express.static(__dirname + "/assets"));

var cookieParser = require('cookie-parser')
app.use(cookieParser())


/*  ===========
DATA + FUNCTIONS
============= */

// URL DATABASE
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "Hy7W2r": "http://www.amazon.com",
};

// REGISTERED USER DATABASE
const users = {
  "user-4Tty23": {
    id: "user-4Tty23",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user-Xi2q9U": {
    id: "user-Xi2q9U",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "user-123456": {
     id: "user123456",
     email: "test@test.com",
     password: "test"
   }
};

// GENERATE RANDOM ID FUNCTION
function generateRandomString() {
  let id = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    id += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return id;
}

/*  ===========
    GET ROUTES
============= */

// Redirect '/' to '/urls/new'
app.get('/', (req, res) => {
  res.redirect('/urls/new');
});

// CREATE NEW URL PAGE
app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
  }
  res.render("urls_new", templateVars);
});

// URL INDEX PAGE
app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  }
  res.render("urls_index", templateVars);
});

// EDIT URL PAGE
app.get("/urls/:id", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    shortURL: req.params.id,
    urls: urlDatabase
  };
  for (let urls in urlDatabase) {
    if (urls === req.params.id) {
      res.render("urls_show", templateVars);
      return;
    }
  };
res.status(404).render('404');
});

// REGISTER PAGE
app.get('/register', (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
  };
  res.render("register", templateVars);
});

// REDIRECT LINK
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  for (let urls in urlDatabase) {
    if (urls === shortURL) {
      res.redirect(302, longURL);
      return;
    }
  };
  res.status(404).render('404');
});

/*  ===========
   POST ROUTES
============= */

// CREATE NEW URL - POST
app.post("/urls", (req, res) => {
  // Create new short URL id and add to database
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  // Respond with redirect to shortened URL's page
  res.redirect(`/urls/${shortURL}`);
});

// DELETE URL - POST
app.post("/urls/:id/delete", (req, res) => {
  let deleteId = req.params.id;
  delete urlDatabase[deleteId];
  res.redirect(`../`);
});

// EDIT URL - POST
app.post("/urls/:id", (req, res) => {
  let editId = req.params.id;
  let updatedLongURL = req.body.updatedlongURL;
  urlDatabase[editId] = updatedLongURL;
  res.redirect(`/urls/${editId}`);
});

// USER LOGIN  - POST
app.post("/login", (req, res) => {
  let userinput = req.body.logintext;
  //console.log(userinput);
  res.cookie('username', userinput);
  res.redirect(`/urls`);
});

// USER LOGOUT  - POST
app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect(`/urls`);
});

// REGISTER - POST
app.post('/register', (req, res) => {
  let userId = `user-${generateRandomString()}`;
  let userEmail = req.body.email;
  let userPassword = req.body.password;
  users[userId] = {
    id: userId,
    email: userEmail,
    password: userPassword
  }
  console.log(users);
  res.cookie('user-id', userId);
  res.redirect(`/urls`);
});

/*  ===========
      OTHER
============= */

// RETURN 404 ERROR PAGE
app.use((req, res) => {
  res.status(404).render('404');
})

// LISTEN ON PORT 8080
app.listen(port, () => {
  console.log(`TinyApp listening on localhost:${port}`);
});
