import express from "express";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require(__dirname + "/../config/config.json");

const app = express();
app.locals.pretty = true;

app.set("view engine", "ejs");
app.set("views", __dirname + "/../views");
app.use(express.static(__dirname + "/../public"));

app.get("/", (req, res) => {
  res.render("index", {
    url: config.project.url,
    game: config.project.game,
  });
});

app.get("/admin", (req, res) => {
  res.render("admin", {
    url: config.project.url,
    game: config.project.game,
  });
});

app.get("/display", (req, res) => {
  res.render("display", {
    url: config.project.url,
    game: config.project.game,
    cdn: config.project.cdn,
  });
});

app.get("/tutorial", (req, res) => {
  res.render("play", {
    url: config.project.url,
    game: config.project.game,
    cdn: config.project.cdn,
    isTutorial: "true",
  });
});

app.get("/select", (req, res) => {
  res.render("select", {
    url: config.project.url,
    game: config.project.game,
    cdn: config.project.cdn,
    api: "https://dapi.rhyga.me",
  });
});

app.get("/play", (req, res) => {
  res.render("play", {
    url: config.project.url,
    game: config.project.game,
    cdn: config.project.cdn,
    isTutorial: "false",
  });
});

app.listen(config.project.port, () => {
  console.log(`HTTP Server running at port ${config.project.port}.`);
});
