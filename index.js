import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "Mrohith77.",
  port: 5433,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 5;
let userColor;
let users = [
  { id: 1, name: "Angela", color: "teal" },
  { id: 2, name: "Jack", color: "powderblue" },
];

async function checkVisited() {
  const result = await db.query(`SELECT country_code,color FROM user_data JOIN visited_countries ON user_data.id = visited_countries.user_id WHERE user_id = ${currentUserId}`);
  const result2 = await db.query(`SELECT * FROM user_data `)
  console.log(result2);
  console.log(result);
  users = []
  result2.rows.forEach((user)=>{
    users.push(user);
  })
  console.log("users data is ",users);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
    userColor = country.color;
  });
  console.log("visited countries are ", countries,"and the favourite color of the user is ", userColor)
  return countries;
}

app.get("/", async (req, res) => {
  const countries = await checkVisited();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: userColor,
  });
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    if (countryCode === "IO") {
      countryCode = "IN";
    }
    console.log("selected country by the user is ", countryCode)
    try {
      await db.query(
        "INSERT INTO visited_countries (user_id,country_code) VALUES ($1,$2)",
        [currentUserId, countryCode]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/user", async (req, res) => {
  console.log(req.body)
  if(req.body.add === "new"){
    res.render("new.ejs");
  }
  else{
    currentUserId = req.body.user;
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  console.log("data of the new user is ", req.body)
  const result = await db.query("INSERT INTO user_data(name,color) VALUES($1,$2)", [req.body.name, req.body.color])
  console.log(result.rows[0])
  res.redirect("/")
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
