const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/bronzebird.db');

const express = require('express');

const app = express();

const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');

const insertCharacter = 'INSERT INTO Characters (characterName, characterRace, characterClass, characterLevel, characterAlignment) VALUES ($1, $2, $3, $4, $5);';
const selectCharacters = "SELECT characterID, characterName, characterRace, characterClass, characterLevel, characterAlignment FROM Characters;";

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true }));

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







/*  MUST BE AT END OF GETS
    Takes any undefined path
    and displays an error message
                                    */ 
app.get("*", function(req,res){
    res.send("<h1>Page Not Found</h1>");
});
