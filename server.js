require("dotenv").config();


const app = require("./src/app");

const connectToDB = require("./src/config/db");

connectToDB();

//connect to database mongoDB
app.listen(3000, ()=> {
    console.log("server starts at port 3000");
});


