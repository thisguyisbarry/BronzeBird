const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/bronzebird.db');

const express = require('express');

const app = express();

app.listen(3000, function() {
    console.log("Server running on port 3000");
});


app.use(express.static("public"));


/*  MUST BE AT END OF GETS
    Takes any undefined path
    and displays an error message
                                    */ 
app.get("*", function(req,res){
    res.send("<h1>Page Not Found</h1>");
});
