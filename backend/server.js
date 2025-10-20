import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// test route lmao
app.get('/', (req, res) => {
  res.send('Hello, Steam backend is working!');
});

// Report 1
app.get('/api/most-played', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const sql = `
        SELECT g.AppName AS Name,
            p.Peak_CCU AS PeakCCU,
            p.\`AvgPlaytimeForever\` AS AveragePlaytime
        FROM Games g
        JOIN Playtime p ON g.PlaytimeID = p.PlaytimeID
        ORDER BY p.Peak_CCU DESC
        LIMIT ?;
    `;
    const [rows] = await pool.query(sql, [limit]);
    res.json(rows);
  } catch (err) {
    console.error('Database query error (Most Played):', err);
    res.status(500).json({ error: err.message });
  }
});

// Report 2
app.get('/api/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const sql = `
      SELECT g.AppName AS Name,
             rd.ReleaseYear,
             rd.ReleaseMonth,
             rd.ReleaseDay
      FROM Games g
      JOIN ReleaseDate rd ON g.ReleaseDateID = rd.ReleaseDateID
      ORDER BY rd.ReleaseYear DESC, rd.ReleaseMonth DESC, rd.ReleaseDay DESC
      LIMIT ?;
    `;
    const [rows] = await pool.query(sql, [limit]);
    res.json(rows);
  } catch (err) {
    console.error('Database query error (Report 2):', err);
    res.status(500).json({ error: err.message });
  }
});

// Report 3
app.get('/api/top-rated', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const sql = `
      SELECT g.AppName AS Name,
             r.User_Score AS UserScore,
             r.Metacritic_Score AS MetacriticScore
      FROM Games g
      JOIN Reviews r ON g.ReviewsID = r.ReviewsID
      WHERE r.User_Score IS NOT NULL AND r.Metacritic_Score IS NOT NULL
      ORDER BY r.User_Score DESC
      LIMIT ?;
    `;
    const [rows] = await pool.query(sql, [limit]);
    res.json(rows);
  } catch (err) {
    console.error('Database query error (Report 3):', err);
    res.status(500).json({ error: err.message });
  }
});

// Report 4
app.get('/api/price-vs-rating', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const sql = `
      SELECT g.AppName AS Name,
             s.Launch_Price AS Price,
             r.User_Score AS UserScore,
             r.Positive + r.Negative AS Reviews
      FROM Games g
      JOIN Sales s ON g.SalesID = s.SalesID
      JOIN Reviews r ON g.ReviewsID = r.ReviewsID
      WHERE s.Launch_Price IS NOT NULL AND r.User_Score IS NOT NULL
      ORDER BY Reviews DESC
      LIMIT ?;
    `;
    const [rows] = await pool.query(sql, [limit]);
    res.json(rows);
  } catch (err) {
    console.error('Database query error (Report 4):', err);
    res.status(500).json({ error: err.message });
  }
});

// Report 5
app.get('/api/platforms-breakdown', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const sql = `
      SELECT g.AppName AS Game,
             pl.Windows,
             pl.Mac AS MacOS,
             pl.Linux
      FROM Games g
      JOIN Platforms pl ON g.PlatformsID = pl.PlatformsID
      LIMIT ?;
    `;
    const [rows] = await pool.query(sql, [limit]);
    res.json(rows);
  } catch (err) {
    console.error('Database query error (Report 5):', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));