const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/bronzebird.db');

const express = require('express');
const session = require('express-session');
const app = express();
const { body, validationResult } = require('express-validator');

// passport
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

//bodyparser
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true }));

// bycrypt
const bcrypt = require('bcrypt');

// sql consts
const insertCharacter = 'INSERT INTO Characters (characterName, characterRace, characterClass, characterLevel, characterAlignment) VALUES ($1, $2, $3, $4, $5);';
const selectCharacters = "SELECT characterID, characterName, characterRace, characterClass, characterLevel, characterAlignment FROM Characters;";

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

app.use(express.static("public"));


app.get("/", function(req, res) {
    res.sendFile(__dirname + "/public/index.html");
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

        const insert =db.prepare(insertCharacter);
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

/**
 * Register
 */
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
        email = req.body.email;
        username = req.body.username;
        password = req.body.password;

        // check if email is already registered
        const emailQuery = db.prepare('SELECT Email FROM Users WHERE Email = $1;');
        emailQuery.get(email, function(err, row) {
            if (row) {
                console.log("There is already a user registered with this email");
                return;
            }
        })

        // check if username is taken
        const userQuery = db.prepare('SELECT Username FROM Users WHERE Username = $1;');
        userQuery.get(username, function(err, row) {
            if (row) {
                console.log("This username is not available");
                return;
            }
        })

        // insert email, username and encrypted password into database
        bcrypt.hash(password, 10, function(err, hash) {
            const insert = db.prepare('INSERT INTO Users (email, username, password) VALUES ($1, $2, $3);');
            insert.run(email, username, hash);
            insert.finalize();
        });

        console.log("Successfully registered");
    }
    else {
        return res.status(400).json({ errors: errors.array() });
    }
})


/**
 * Login
 */
app.post('/login', function(req, res, next) {
    console.log("login");
    // passport local authentication
    passport.authenticate('local', { 
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true 
    });
});

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(
    function (username, password, done) {
        // select username aand password from database
        const query = db.prepare('SELECT Username, Password FROM Users WHERE Username = $1;');
        query.get(username, function (err, row) {
            if (err) {
                return done(err);
            }
            if (!row) {
                return done(null, false, { message: 'User not found.' });
            }
            // compare username enmcrypted password
            bcrypt.compare(password, row.password, function (err, result) {
                if (result == true) {
                    console.log("Login successful");
                    done(null, { username: row.username });
                } else {
                    console.log("Login failed");
                    return done(null, false, { message: 'Incorrect password' });
                }
            });
        });
    }
));







/*  MUST BE AT END OF GETS
    Takes any undefined path
    and displays an error message
                                    */
app.get("*", function (req, res) {
    res.send("<h1>Page Not Found</h1>");
});
