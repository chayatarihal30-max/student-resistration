// frontend/src/App.jsx

import { useState, useEffect } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";

function App() {
  const [name, setName] = useState("");
  const [habits, setHabits] = useState([]);
  const [checkins, setCheckins] = useState({});
  const [loading, setLoading] = useState(true);

  // Load habits and check-ins
  const refreshAll = async () => {
    try {
      const res = await fetch(`${API_URL}/habits`);
      const data = await res.json();
      setHabits(data);

      const obj = {};
      for (const h of data) {
        const r = await fetch(`${API_URL}/habits/${h.id}/checkins`);
        obj[h.id] = await r.json();
      }
      setCheckins(obj);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // Add habit
  const addHabit = async () => {
    if (!name.trim()) return;

    try {
      await fetch(`${API_URL}/habits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      setName("");
      refreshAll();
    } catch (err) {
      console.error(err);
    }
  };

  // Check in
  const checkIn = async (id) => {
    try {
      await fetch(`${API_URL}/habits/${id}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      refreshAll();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete habit
  const deleteHabit = async (id) => {
    try {
      await fetch(`${API_URL}/habits/${id}`, {
        method: "DELETE",
      });

      refreshAll();
    } catch (err) {
      console.error(err);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="container">
      <h1>🔥 Habit Tracker</h1>

      <div className="newHabit">
        <input
          placeholder="e.g. Drink 2L water"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addHabit()}
        />
        <button onClick={addHabit}>Add Habit</button>
      </div>

      {loading ? (
        <p>Loading your habits...</p>
      ) : habits.length === 0 ? (
        <p>No habits yet. Add one above to get started!</p>
      ) : (
        habits.map((h) => {
          const done = checkins[h.id]?.includes(today);

          return (
            <div className="habit-card" key={h.id}>
              <h3>{h.name}</h3>

              <p className="streak">
                {h.streak > 0
                  ? `🔥 ${h.streak} day streak`
                  : "No streak yet — check in today!"}
              </p>

              <button
                disabled={done}
                onClick={() => checkIn(h.id)}
              >
                {done ? "✅ Checked in today" : "Check In"}
              </button>

              <button
                className="delete"
                onClick={() => deleteHabit(h.id)}
              >
                Delete Habit
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}

export default App;