// backend/index.js

const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");

const app = express();
const db = new Database("data.db");

app.use(cors());
app.use(express.json());

// Create habits table
db.prepare(`
CREATE TABLE IF NOT EXISTS habits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
)
`).run();

// Create checkins table
db.prepare(`
CREATE TABLE IF NOT EXISTS checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  checked_at TEXT NOT NULL,
  UNIQUE(habit_id, date)
)
`).run();

// Calculate current streak
function calculateStreak(habitId) {
  const rows = db.prepare(
    "SELECT date FROM checkins WHERE habit_id=? ORDER BY date DESC"
  ).all(habitId);

  const dates = rows.map(r => r.date);

  let streak = 0;
  let day = new Date();

  while (true) {
    const d = day.toISOString().split("T")[0];

    if (dates.includes(d)) {
      streak++;
      day.setDate(day.getDate() - 1);
    } else {
      if (streak === 0) {
        day.setDate(day.getDate() - 1);
        const y = day.toISOString().split("T")[0];
        if (dates.includes(y)) {
          streak++;
          day.setDate(day.getDate() - 1);
          while (dates.includes(day.toISOString().split("T")[0])) {
            streak++;
            day.setDate(day.getDate() - 1);
          }
        }
      }
      break;
    }
  }

  return streak;
}

// POST /habits
app.post("/habits", (req, res) => {
  const name = req.body.name?.trim();

  if (!name)
    return res.status(400).json({ error: "name is required" });

  const created_at = new Date().toISOString();

  const result = db.prepare(
    "INSERT INTO habits(name,created_at) VALUES(?,?)"
  ).run(name, created_at);

  res.status(201).json({
    id: result.lastInsertRowid,
    name,
    created_at,
    streak: 0
  });
});

// GET /habits
app.get("/habits", (req, res) => {
  const habits = db.prepare(
    "SELECT * FROM habits ORDER BY created_at"
  ).all();

  const data = habits.map(h => ({
    ...h,
    streak: calculateStreak(h.id)
  }));

  res.json(data);
});

// POST /habits/:id/checkin
app.post("/habits/:id/checkin", (req, res) => {
  const id = req.params.id;

  const habit = db.prepare(
    "SELECT * FROM habits WHERE id=?"
  ).get(id);

  if (!habit)
    return res.status(404).json({ error: "Habit not found" });

  const date =
    req.body.date || new Date().toISOString().split("T")[0];

  try {
    const checked_at = new Date().toISOString();

    const result = db.prepare(
      "INSERT INTO checkins(habit_id,date,checked_at) VALUES(?,?,?)"
    ).run(id, date, checked_at);

    res.status(201).json({
      id: result.lastInsertRowid,
      habit_id: Number(id),
      date,
      checked_at,
      streak: calculateStreak(id)
    });
  } catch {
    res.status(409).json({
      error: "Already checked in for this date"
    });
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});