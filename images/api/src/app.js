const express = require("express");
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const client = new MongoClient(process.env.MONGO_URL);
const app = express();

app.use(express.json());
app.use(cors());

const checkToken = (req, res, next) => {
  const token = req.headers["token"];
  if (token) {
    try {
      jwt.verify(token, process.env.ACCES_TOKEN_SECRET);
      next();
    } catch (err) {
      return res.status(410).send({
        error: "Invalid token",
        status: 410,
      });
    }
  } else {
    return res.status(401).send({
      error: "Unauhtorized",
      status: 401,
    });
  }
};

const checkRights = async (req, res, next) => {
  const userId = req.headers["userid"];

  if (!userId) {
    return res.status(403).json({ error: "Access forbidden", status: 403 });
  }
  try {
    await client.connect();
    const db = client.db("Leerpaden").collection("users");
    const checkUser = await db.findOne({ id: userId });
    if (!checkUser) {
      return res
        .status(404)
        .json({ error: "Gebruiker niet gevonden", status: 404 });
    }
    if (checkUser.role != "Admin") {
      return res.status(403).json({ error: "Access forbidden", status: 403 });
    }
    next();
  } catch (err) {
    res.status(500).send({
      error: "An error has occured",
      value: err,
    });
  }
};

app.get("/", async (req, res) => {
  try {
    await client.connect();
    const db = await client.db("Leerpaden").collection("data").findOne({});
    res.status(200).json({ ...db });
  } catch (err) {
    res.status(500).send({
      error: "An error has occured",
      value: err,
    });
  }
});

app.get("/students", async (req, res) => {
  try {
    await client.connect();
    const db = await client
      .db("Leerpaden")
      .collection("users")
      .find({ role: "Student" })
      .toArray();
    res.status(200).json({ data: db });
  } catch (err) {
    res.status(500).send({
      error: "An error has occured",
      value: err,
    });
  }
});

app.get("/users", checkRights, async (req, res) => {
  try {
    await client.connect();
    const db = await client
      .db("Leerpaden")
      .collection("users")
      .find({})
      .toArray();
    res.status(200).json({ data: db });
  } catch (err) {
    res.status(500).send({
      error: "An error has occured",
      value: err,
    });
  }
});

app.post("/register", async (req, res) => {
  const emailRegexTeachers =
    /^[a-zA-Z0-9_.+-]+@(?:(?:[a-zA-Z0-9-]+\.)?[a-zA-Z]+\.)?(ehb|hogent)\.be$/;

  const emailRegexStudents =
    /^[a-zA-Z0-9_.+-]+@(?:(?:[a-zA-Z0-9-]+\.)?[a-zA-Z]+\.)?(student.ehb|student.hogent)\.be$/;

  const { email, password, fullName } = req.body;
  if (!email || !password || !fullName) {
    return res.status(400).json({
      error: "Gelieve de ontbrekende velden in te vullen",
      status: 400,
    });
  }
  if (
    email.match(emailRegexTeachers) == null &&
    email.match(emailRegexStudents) == null
  ) {
    return res
      .status(400)
      .json({ error: "Voer een geldig e-mailadres in", status: 400 });
  }

  try {
    await client.connect();
    const db = client.db("Leerpaden").collection("users");

    const query = {
      email,
    };

    const existingUser = await db.findOne(query);

    if (existingUser) {
      return res.status(400).send({
        error: "User with this email already exists!",
        status: 400,
      });
    }

    const role = checkRole(email);
    const newUser = {
      id: uuidv4(),
      fullName,
      email,
      password,
      role,
    };
    await db.insertOne(newUser);
    return res
      .status(200)
      .json({ message: "Account successfully created", status: 200 });
  } catch (err) {
    res.status(500).send({
      error: "An error has occured",
      value: err,
    });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Gelieve de ontbrekende velden in te vullen" });
  }

  try {
    await client.connect();
    const db = client.db("Leerpaden").collection("users");
    const query = {
      email,
    };
    const user = await db.findOne(query);
    if (!user) {
      return res.status(400).send({
        message: "Gebruiker met dit e-mailadres bestaat niet",
        status: 400,
      });
    }

    if (user.password == password) {
      const token = jwt.sign(
        {
          id: user.id,
        },
        process.env.ACCES_TOKEN_SECRET,
        {
          expiresIn: "1d",
        }
      );
      res.status(200).send({
        message: "Succesvol ingelogd",
        status: 200,
        token,
      });
    } else {
      res.status(400).send({
        message: "Onjuist wachtwoord",
        status: 400,
      });
    }
  } catch (err) {
    res.status(500).send({
      error: "An error has occured",
      value: err,
    });
  }
});

app.get("/profile", checkToken, async (req, res) => {
  const token = req.headers["token"];
  const userData = jwt.decode(token);

  try {
    await client.connect();
    const db = client.db("Leerpaden").collection("users");
    const query = { id: userData.id };
    const user = await db.findOne(query);
    res.json({
      user,
      status: 200,
    });
  } catch (err) {
    res.status(500).send({
      error: "An error has occured",
      value: err,
    });
  }
});

app.put("/profile/:id", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({
        error: "Gelieve de ontbrekende velden in te vullen",
        status: 400,
      });
    }

    const id = req.params.id;

    await client.connect();
    const db = client.db("Leerpaden").collection("users");
    const userExists = await db.findOne({ id });
    if (!userExists) {
      return res
        .status(404)
        .json({ error: "Gebruiker niet gevonden", status: 404 });
    }

    await db.findOneAndUpdate({ id }, { $set: { password } });
    return res.status(200).json({ message: "Profiel gewijzigd", status: 200 });
  } catch (err) {
    res.status(500).send({
      error: "An error has occured",
      value: err,
    });
  }
});

app.put("/users/:id", checkRights, async (req, res) => {
  try {
    const { email, fullName, password } = req.body;
    if (!email || !fullName || !password) {
      return res.status(400).json({
        error: "Gelieve de ontbrekende velden in te vullen",
        status: 400,
      });
    }

    const id = req.params.id;
    await client.connect();
    const db = client.db("Leerpaden").collection("users");
    const userExists = await db.findOne({ id });
    if (!userExists) {
      return res
        .status(404)
        .json({ error: "Gebruiker niet gevonden", status: 404 });
    }

    const newUser = {
      fullName,
      email,
      password,
    };

    await db.findOneAndUpdate({ id }, { $set: newUser });
    return res.status(200).json({ message: "Profiel gewijzigd", status: 200 });
  } catch (err) {
    res.status(500).send({
      error: "An error has occured",
      value: err,
    });
  }
});
app.delete("/profile/:id", checkRights, async (req, res) => {
  try {
    const id = req.params.id;
    const db = client.db("Leerpaden").collection("users");
    const userExists = await db.findOne({ id });
    if (!userExists) {
      return res
        .status(404)
        .json({ error: "Gebruiker niet gevonden", status: 404 });
    }

    await db.findOneAndDelete({ id }).catch((err) => console.log(err));
    return res.status(200).json({ message: "Account verwijderd", status: 200 });
  } catch (err) {
    res.status(500).send({
      error: "An error has occured",
      value: err,
    });
  }
});

app.put("/scenario/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (
      !req.body ||
      !req.body.description ||
      !req.body.title ||
      req.body.steps.length == 0
    ) {
      return res
        .status(400)
        .json({ error: "Gelieve de ontbrekende velden in te vullen" });
    }

    const db = client.db("Leerpaden").collection("data");
    await db.findOneAndUpdate(
      {},
      { $set: { "scenarios.$[element]": req.body } },
      { arrayFilters: [{ "element.id": parseInt(id) }] }
    );

    return res.status(200).json({ message: "Scenario gewijzigd", status: 200 });
  } catch (err) {
    res.status(500).send({
      error: "An error has occured",
      value: err,
    });
  }
});

app.post("/scenario", async (req, res) => {
  const newScenario = req.body;
  try {
    if (
      !newScenario ||
      !newScenario.description ||
      !newScenario.title ||
      newScenario.steps.length == 0
    ) {
      return res
        .status(400)
        .json({ error: "Gelieve de ontbrekende velden in te vullen" });
    }
    await client.connect();
    const db = client.db("Leerpaden").collection("data");

    await db.updateOne({}, { $push: { scenarios: newScenario } });

    res.status(200).send({
      message: "Scenario gemaakt",
      status: 200,
    });
  } catch (err) {
    res.status(500).send({
      error: "An error has occured",
      value: err,
    });
  }
});

app.delete("/scenario/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const db = client.db("Leerpaden").collection("data");
    await db.updateOne({}, { $pull: { scenarios: { id } } });
    return res
      .status(200)
      .json({ message: "Scenario verwijderd", status: 200 });
  } catch (err) {
    res.status(500).send({
      error: "An error has occured",
      value: err,
    });
  }
});

const checkRole = (email) => {
  const emailRegexStudents =
    /^[a-zA-Z0-9_.+-]+@(?:(?:[a-zA-Z0-9-]+\.)?[a-zA-Z]+\.)?(student.ehb|student.hogent)\.be$/;
  if (email.match(emailRegexStudents) == null) {
    return "Teacher";
  } else {
    return "Student";
  }
};

module.exports = app;
