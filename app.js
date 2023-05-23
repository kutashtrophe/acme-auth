const express = require("express");
const app = express();
const {
  models: { User, Note },
} = require("./db");
const path = require("path");
require("dotenv").config();

// middleware
app.use(express.json());

const requireToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    const user = await User.byToken(token);
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// routes
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.post("/api/auth", async (req, res, next) => {
  try {
    res.send({ token: await User.authenticate(req.body) });
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/auth", requireToken, async (req, res, next) => {
  try {
    res.send(req.user);
  } catch (ex) {
    next(ex);
  }
});

// error handling
app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

app.get("/api/users/:id/notes", requireToken, async (req, res, next) => {
  try {
    if (req.user.id === req.params.id) {
      // Get the user and their notes
      const user = await User.findByPk(req.params.id, {
        include: [Note],
      });

      if (user) {
        res.send(user.notes);
      } else {
        res.status(404).send("User not found");
      }
    } else {
      res.status(401).send("Unauthorized");
    }
  } catch (ex) {
    next(ex);
  }
});

module.exports = app;
