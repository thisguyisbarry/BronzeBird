const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/bronzebird.db');

const express = require('express');
const session = require('express-session');
const app = express();
app.use(express.static('public'));

const { body, validationResult } = require('express-validator');

//bodyparser
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true }));

// bcrypt
const bcrypt = require('bcrypt');
const saltrounds = 10;

const crypto = require('crypto');

// passport
const passport = require('passport');
const { contextsKey } = require('express-validator/src/base');
const LocalStrategy = require('passport-local').Strategy;

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(
    function (username, password, done) {
        // select username and password from database
        const userQuery = db.prepare('SELECT username, password FROM Users WHERE username = $1;');
        userQuery.get(username, function(err, row) {
            if (err) {
                return done(err);
            }
            if (!row) {
                return done(null, false, { message: 'User not found.' });
            }

            // compare password
            bcrypt.compare(password, row.password, function(err, result) {
                if (result) {
                    return done(null, row);
                }
                else {
                    return done(null, false, { message: 'Incorrect password'})
                }
            });
        });
    }
));

passport.serializeUser(function (user, done) {
    return done(null, user.username);
});

passport.deserializeUser(function(id, done) {
    const query = db.prepare('SELECT username FROM Users WHERE username = $1;');
    query.get(username, function(err, row) {
        if (!row) {
            return done(null, false);
        }
        else {
            return done(err, row);
        }
    });
});

// sql consts
const insertCharacter = 'INSERT INTO Characters (characterName, characterRace, characterClass, characterLevel, characterAlignment) VALUES ($1, $2, $3, $4, $5);';
const selectCharacters = "SELECT characterID, characterName, characterRace, characterClass, characterLevel, characterAlignment FROM Characters;";
const deleteCharacter = 'DELETE FROM Characters WHERE characterID = $1;';


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/create", function(req, res) {
    res.sendFile(__dirname + "/public/sheet/create.html");
});

app.post("/submitCharacter", [
        body('characterName'),
        body('characterRace'),
        body('characterClass'),
        body('characterLevel'),
        body('characterAlignment')
    ], 
    function(req, res){
        const validErrors = validationResult(req);

        if(!validErrors.isEmpty()){
            console.log(validErrors);
            res.status(400).json({errors: validErrors.array()});
        } else{

        const characterName      = req.body.characterName;
        const characterRace      = req.body.characterRace;
        const characterClass     = req.body.characterClass;
        const characterLevel     = req.body.characterLevel;
        const characterAlignment = req.body.characterAlignment;
        console.log(`${characterName}, ${characterRace}, ${characterClass}, ${characterLevel}, ${characterAlignment}`);

        const insert = db.prepare(insertCharacter);
        insert.run(characterName, characterRace, characterClass, characterLevel, characterAlignment);
        insert.finalize();

        const query = db.prepare(selectCharacters);

        query.all(function(error, rows) {
            if (error){
                console.log(error);
                res.status(400).json(error);
            } else{
                console.log(rows);
                res.status(200).json(rows);
            }

        });

        }
        

});

app.get("/saved", function(req, res){
    res.sendFile(__dirname + "/public/saved/saved.html");
});

// TODO: Change to only get a user's characters
app.get('/retrieveUserCharacters', function(req, res) {
    const query = db.prepare(selectCharacters);
    query.all(function(error, rows) {
        if (error) {
            console.log(error);
            res.status(400).json(error);
        } else {
            res.status(200).json(rows);
        }
    });
});

app.post("/deleteCharacter", function(req, res) {
    const characterID = parseInt(req.body.characterID);
    const deleteStmt = db.prepare(deleteCharacter);
    deleteStmt.run(characterID);
    deleteStmt.finalize(function() {

    });

    const query = db.prepare(selectCharacters);
    query.all(function(error, rows) {
        if (error) {
            console.log(error);
            res.status(400).json(error);
        } else {
            console.log(rows);
            res.status(200).json(rows);
        }
    });

});


/**
 * Register
 */

app.get("/register", function(req, res) {
    res.sendFile(__dirname + "/public/user/register.html");
});

app.post('/register', [
    // email validation
    body('email')
    .notEmpty()
    .isEmail()
    .normalizeEmail(),

    // username validation
    body('username')
    .notEmpty()
    .isAlphanumeric(),

    // password validation
    body('password')
    .isLength({ min: 8 })

], function(req, res) {
    console.log("register");

    const errors = validationResult(req);

    if (errors.isEmpty()) { // if the email, username and password are valid
        const email = req.body.email;
        const username = req.body.username;
        const password = req.body.password;

        // check if email is already registered
        const emailQuery = db.prepare('SELECT email FROM Users WHERE email = $1;');
        emailQuery.get(email, function(err, row) {
            if (row) {
                return;
            }
        });

        // check if username is taken
        const userQuery = db.prepare('SELECT username FROM Users WHERE username = $1;');
        userQuery.get(username, function(err, row) {
            if (row) {
                return;
            }
        });

        // insert email, username and encrypted password into database
        bcrypt.hash(password, saltrounds, function(err, hash) {
            const insert = db.prepare('INSERT INTO Users (email, username, password) VALUES ($1, $2, $3);');
            insert.run(email, username, hash);
            insert.finalize();
        });

        console.log(`\nNew user created\n\tEmail: ${email}\n\tUsername: ${username}`);
        res.send({err: 0, redirectUrl: "/login"});
    }
    else {
        return res.status(400).json({ errors: errors.array() });
    }
});


/**
 * Login
 */

app.get('/login', function(req, res) {
    res.sendFile(__dirname + "/public/user/login.html");
});

app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), function(req, res) {
    res.redirect('/');
});


/**
 * Forgot Password
 */

app.get('/forgot-password', function(req, res) {
    res.sendFile(__dirname + "/public/user/forgot-password.html");
});

app.post('/forgot-password', [
    body('username').notEmpty()
], function(req, res) {
    const emailOrUsername = req.body.username;
    const emailQuery = db.prepare('SELECT email, username FROM Users WHERE email = $1 OR username = $1');
    emailQuery.get(emailOrUsername, function(err, row) {
        if (err) {
            return;
        }

        if (row) {
            const email = row.email;
            const username = row.username;
            const tokenQuery = db.prepare('SELECT * FROM PasswordResetRequests WHERE username = $1 AND expiryDate > datetime(\'now\') AND used = 0;')
            tokenQuery.get(username, function(err, row) {
                if (err) {
                    return;
                }

                if (row) {
                    return;
                }
                else {
                    token = crypto.randomBytes(32).toString('hex');
                    bcrypt.hash(token, saltrounds, function(err, hash) {
                        const tokenInsert = db.prepare('INSERT INTO PasswordResetRequests (username, token) VALUES ($1, $2);');
                        tokenInsert.run(username, hash);
                        tokenInsert.finalize();
                    });

                    //TODO send password reset email
                    
                    res.sendFile(__dirname + '/public/user/email-sent.html');
                }
            });
        }
    });
});

app.get('/change-password', function(req, res) {
    res.sendFile(__dirname + '/public/user/change-password.html');
});

app.post('/change-password', [
    body('token'),
    body('username'),
    body('password').isLength({min:8})
], function(req, res) {
    res.sendFile(__dirname, '/public/user/change-password.html');
    const username = req.body.username;
    const password = req.body.password;
    const token = req.body.token;
    const tokenQuery = db.prepare('SELECT token FROM PasswordResetRequests WHERE username = $1 AND expiryDate > datetime(\'now\') AND used = 0;');
    tokenQuery.get(username, function(err, row) {
        if (err) {
            return;
        }

        if (row) {
            bcrypt.compare(token, row.token, function(err, res) {
                if (res) {
                    const updatePassword = db.prepare('UPDATE Users SET password = $1 WHERE username = $2;');
                    updatePassword.run(password, username);
                    updatePassword.finalize();
                }
            });
        }
    });
});


/*  MUST BE AT END OF GETS
    Takes any undefined path
    and displays an error message
                                    */
app.get("*", function (req, res) {
    res.send("<h1>Page Not Found</h1>");
});
