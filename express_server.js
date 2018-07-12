"use strict";
/*  ===============
      SETUP
================= */

const express = require("express");
const app = express();
const port = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')

app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({extended: true}));
app.use("/assets",express.static(__dirname + "/assets"));
app.use(cookieParser())

/*  ===============
  DATA + FUNCTIONS
================= */

// URL DATABASE
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "user-4Tty23"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user-123456"
  },
  "Hy7W2r": {
    longURL: "http://www.amazon.com",
    userID: "user-123456"
  }
};

// REGISTERED USER DATABASE
const users = {
  "user-4Tty23": {
    id: "user-4Tty23",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user-vN1jLu": {
    id: "user-vN1jLu",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "user-123456": {
     id: "user-123456",
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

/*  ===============
      GET ROUTES
================= */

// Redirect '/' to '/urls/new'
app.get('/', (req, res) => {
  res.redirect('/urls/new');
});

// CREATE NEW URL PAGE
app.get("/urls/new", (req, res) => {
  let currentUser = users[req.cookies['user_id']];
  let templateVars = {
    user: currentUser,
  }
  if (!currentUser) {
    res.redirect(`/login`);
    return;
  }
  res.render("urls_new", templateVars);
});

// URL INDEX PAGE
app.get("/urls", (req, res) => {
  let currentUser = users[req.cookies['user_id']];
  let templateVars = {
    urls: urlDatabase,
    user: currentUser,
  }
  res.render("urls_index", templateVars);
});

// EDIT URL PAGE
app.get("/urls/:id", (req, res) => {
  let currentUser = users[req.cookies['user_id']];
  let templateVars = {
    user: currentUser,
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
  let currentUser = users[req.cookies['user_id']]
  let templateVars = {
    user: currentUser,
  };
  res.render("register", templateVars);
});

// LOGIN PAGE
app.get('/login', (req, res) => {
  let currentUser = users[req.cookies['user_id']];
  let templateVars = {
    user: currentUser,
  };
  res.render("login", templateVars);
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

/*  ===============
     POST ROUTES
================= */

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
  let currentUser = users[req.cookies['user_id']].id;
  // console.log(deleteId, currentUser.id, urlDatabase[deleteId].userID);
  if (currentUser !== urlDatabase[deleteId].userID) {
    console.log('Error - not authorized to delete link');
    res.status(403).render('404');
    return;
  }
  delete urlDatabase[deleteId];
  res.redirect(`../`);
});

// EDIT URL - POST
app.post("/urls/:id", (req, res) => {
  let editId = req.params.id;
  let currentUser = users[req.cookies['user_id']].id;
  if (currentUser !== urlDatabase[editId].userID) {
    console.log('Error - not authorized to edit link');
    res.status(403).render('404');
    return;
  }
  let updatedLongURL = req.body.updatedlongURL;
  urlDatabase[editId].longURL = updatedLongURL;
  res.redirect(`/urls/${editId}`);
});

// USER LOGIN  - POST
app.post("/login", (req, res) => {
  let loginEmail = req.body.email;
  let loginPassword = req.body.password;
  // check if user exists in DB with email
  for (let userId in users) {
    let user = users[userId];
    if (loginEmail === user.email) {
      // check for correct password
      if (loginPassword !== user.password) {
        console.log('Login Error - incorrect password');
        res.status(403).render('404');
        return;
      }
      res.cookie('user_id', user.id);
      res.redirect(`/`);
      return;
    }
  }
  console.log('Login Error - email not registered');
  res.status(403).render('404');
});

// USER LOGOUT  - POST
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect(`/`);
});

// REGISTER - POST
app.post('/register', (req, res) => {
  let userId = `user-${generateRandomString()}`;
  let userEmail = req.body.email;
  let userPassword = req.body.password;

  // Check for empty email or password
  if (!userEmail || !userPassword) {
    console.log('error - empty email or password');
    res.status(400).render('404');
    return;
  };
  // Check that email does not exist
  for (let user in users) {
    let email = users[user].email;
    if (userEmail === email) {
      console.log('error - email already registered');
      res.status(400).render('404');
      return;
    }
  }
  // Create new registered user
  users[userId] = {
    id: userId,
    email: userEmail,
    password: userPassword
  }
  res.cookie('user_id', userId);
  res.redirect(`/urls`);
});

/*  ===============
        OTHER
================= */

// RETURN 404 ERROR PAGE
app.use((req, res) => {
  res.status(404).render('404');
})

// LISTEN ON PORT 8080
app.listen(port, () => {
  console.log(`TinyApp listening on localhost:${port}`);
});


//// TO DO
// Add custom error message to 404 page depending on error
// Add register and login links to _header.ejs
