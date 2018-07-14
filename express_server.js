'use strict';
/*  ===============
      SETUP
================= */

const express = require('express');
const app = express();
const port = 8080; // default port 8080

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

var cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['secret'],
}));

var bcrypt = require('bcrypt');
const saltRounds = 12;

app.set('view engine', 'ejs');
app.use('/assets', express.static(__dirname + '/assets'));

/*  ===============
  DATA + FUNCTIONS
================= */

// URL DATABASE
const urlDatabase = {
  b2xVn2: {
    longURL: 'http://www.lighthouselabs.ca',
    userID: 'user_vN1jLu',
  },
  Asm5xK: {
    longURL: 'http://www.google.com',
    userID: 'user_123456',
  },
  Hy7W2r: {
    longURL: 'http://www.amazon.com',
    userID: 'user_123456',
  },
};

// REGISTERED USER DATABASE
const users = {
  user_4Tty23: {
    id: 'user_4Tty23',
    email: 'user@example.com',
    password: '$2b$12$BFYgYxD4qTmd2IUMoKB6zuBt3xI2Mv2Iyy/ix4cFXWrn8USo.EGn2',
  },
  user_vN1jLu: {
    id: 'user_vN1jLu',
    email: 'test2@test.com',
    password: '$2b$12$pSCMuhBE2eEFZr8zfXQvueOXHMqxvc1VvQ//lw7DW7DNaz2Zdxefe',
  },
  user_123456: {
    id: 'user_123456',
    email: 'test@test.com',
    password: '$2b$12$pSCMuhBE2eEFZr8zfXQvueOXHMqxvc1VvQ//lw7DW7DNaz2Zdxefe',
  },
};

// GENERATE RANDOM ID FUNCTION
function generateRandomString() {
  let id = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    id += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return id;
}

// FILTER URLS BY USER ID FUNCTION:
function urlsForUser(id) {
  let output = {};
  for (let urlId in urlDatabase) {
    let item = urlDatabase[urlId];
    if (item.userID === id) {
      output[urlId] = {
        longURL: item.longURL,
        userID: item.userID,
      };
    }
  }
  return output;
}

/*  ===============
      GET ROUTES
================= */

// REDIRECT HOME
app.get('/', (req, res) => {
  res.redirect('/urls');
});

// REGISTER PAGE
app.get('/register', (req, res) => {
  let currentUser = users[req.session['user_id']];
  if (currentUser) {
    res.redirect('/urls');
    return;
  }
  let templateVars = {
    user: currentUser,
  };
  res.render('register', templateVars);
});

// LOGIN PAGE
app.get('/login', (req, res) => {
  let currentUser = users[req.session['user_id']];
  if (currentUser) {
    res.redirect('/urls');
    return;
  }
  let templateVars = {
    user: currentUser,
  };
  res.render('login', templateVars);
});

// CREATE NEW URL PAGE
app.get('/urls/new', (req, res) => {
  let currentUser = users[req.session['user_id']];
  let templateVars = {
    user: currentUser,
  };
  if (!currentUser) {
    res.redirect(`/login`);
    return;
  }
  res.render('urls_new', templateVars);
});

// URL INDEX PAGE
app.get('/urls', (req, res) => {
  let currentUser = users[req.session['user_id']];
  if (!currentUser) {
    res.redirect('/login');
    return;
  }
  let templateVars = {
    urls: urlsForUser(currentUser.id),
    user: currentUser,
  };
  res.render('urls_index', templateVars);
});

// EDIT URL PAGE
app.get('/urls/:id', (req, res) => {
  let currentUser = users[req.session['user_id']];

  // Check if link exists in database
  if (!urlDatabase[req.params.id]) {
    console.log('Error - URL does not exist');
    res.status(404).render('404');
    return;
  }

  // Check if user is logged in
  if (!currentUser) {
    let templateVars = {
      user: 0,
      shortURL: req.params.id,
      urls: urlDatabase,
    };
    for (let urls in urlDatabase) {
      if (urls === req.params.id) {
        res.render('urls_show', templateVars);
        return;
      }
    };
    res.status(404).render('404');
  }

  // Check if logged in user owns the link
  if (currentUser.id !== urlDatabase[req.params.id].userID) {
    let templateVars = {
      user: 0,
      shortURL: req.params.id,
      urls: urlDatabase,
    };
    for (let urls in urlDatabase) {
      if (urls === req.params.id) {
        res.render('urls_show', templateVars);
        return;
      }
    };
    res.status(404).render('404');
  }

  // Logged in and owns link => Show edit page:
  let templateVars = {
    user: currentUser,
    shortURL: req.params.id,
    urls: urlDatabase,
  };
  for (let urls in urlDatabase) {
    if (urls === req.params.id) {
      res.render('urls_show', templateVars);
      return;
    }
  };
  res.status(404).render('404');
});

// REDIRECT LINK
app.get('/u/:shortURL', (req, res) => {
  let shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    res.status(404).render('404');
    return;
  }
  let longURL = urlDatabase[shortURL].longURL;
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
app.post('/urls', (req, res) => {
  let currentUser = users[req.session['user_id']].id;
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: currentUser,
  };
  res.redirect(`/urls/${shortURL}`);
});

// DELETE URL - POST
app.post('/urls/:id/delete', (req, res) => {
  let deleteId = req.params.id;
  let currentUser = users[req.session['user_id']].id;
  if (currentUser !== urlDatabase[deleteId].userID) {
    console.log('Error - not authorized to delete link');
    res.status(403).render('404');
    return;
  }
  delete urlDatabase[deleteId];
  res.redirect(`../`);
});

// EDIT URL - POST
app.post('/urls/:id', (req, res) => {
  let editId = req.params.id;
  let currentUser = users[req.session['user_id']].id;
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
app.post('/login', (req, res) => {
  let loginEmail = req.body.email;
  let loginPassword = req.body.password;
  for (let userId in users) {
    let user = users[userId];
    if (loginEmail === user.email) {
      // Check for correct password
      if (!bcrypt.compareSync(loginPassword, user.password)) {
        console.log('Login Error - incorrect password');
        res.status(403).render('404');
        return;
      }
      req.session['user_id'] = user.id;
      res.redirect(`/`);
      return;
    }
  }
  console.log('Login Error - email not registered');
  res.status(403).render('404');
});

// USER LOGOUT  - POST
app.post('/logout', (req, res) => {
  // Clear cookie
  req.session.user_id = undefined;
  res.redirect('/');
});

// REGISTER - POST
app.post('/register', (req, res) => {
  let userId = `user_${generateRandomString()}`;
  let userEmail = req.body.email;
  let userPassword = req.body.password;
  let hashedPassword = bcrypt.hashSync(userPassword, saltRounds);
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
    password: hashedPassword,
  };
  req.session['user_id'] = userId;
  res.redirect(`/urls`);
});

/*  ===============
        OTHER
================= */

// RETURN 404 ERROR PAGE
app.use((req, res) => {
  res.status(404).render('404');
});

// LISTEN ON PORT 8080
app.listen(port, () => {
  console.log(`TinyApp listening on localhost:${port}`);
});
