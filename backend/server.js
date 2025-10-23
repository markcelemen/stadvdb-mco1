import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// A simple test route to confirm the server is running
app.get('/', (req, res) => {
  res.send('Hello, Steam backend is working!');
});

// Report 1: Most Played Games
app.get('/api/most-played', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const sql = `
        SELECT g.AppName AS Name,
               p.Peak_CCU AS PeakCCU,
               p.AvgPlaytimeForever AS AveragePlaytime
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

// Report 2: Trending Games (Recently Released)
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
    console.error('Database query error (Trending):', err);
    res.status(500).json({ error: err.message });
  }
});

// Report 3: Critic Score vs Total Reviews
app.get('/api/critic-vs-reviews', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const sql = `
      SELECT 
        g.AppName AS Name,
        r.Metacritic_Score AS MetacriticScore,
        (r.Positive + r.Negative) AS TotalReviews
      FROM Games g
      JOIN Reviews r ON g.ReviewsID = r.ReviewsID
      WHERE r.Metacritic_Score > 0 
      AND (r.Positive + r.Negative) > 0
      ORDER BY TotalReviews DESC
      LIMIT ?;
    `;
    const [rows] = await pool.query(sql, [limit]);
    res.json(rows);
  } catch (err) {
    console.error('Database query error (Critic vs Reviews):', err);
    res.status(500).json({ error: err.message });
  }
});

// Report 4: Price vs Rating 
app.get('/api/price-vs-rating', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const sql = `
      SELECT g.AppName AS Name,
             s.Launch_Price AS LaunchPrice,
             r.Metacritic_Score AS MetacriticScore,
             (r.Positive + r.Negative) AS TotalReviews
      FROM Games g
      JOIN Sales s ON g.SalesID = s.SalesID
      JOIN Reviews r ON g.ReviewsID = r.ReviewsID
      WHERE s.Launch_Price IS NOT NULL
        AND r.Metacritic_Score IS NOT NULL
        AND (r.Positive + r.Negative) > 1000
      ORDER BY TotalReviews DESC
      LIMIT ?;
    `;
    const [rows] = await pool.query(sql, [limit]);
    res.json(rows);
  } catch (err) {
    console.error('Database query error (Price vs Rating):', err);
    res.status(500).json({ error: err.message });
  }
});

// Report 5: Platform Support by Release Year
app.get("/api/platforms", async (req, res) => {
  try {
    const sql = `
      SELECT 
        rd.ReleaseYear,
        SUM(CASE WHEN p.Windows = 1 THEN 1 ELSE 0 END) AS Windows,
        SUM(CASE WHEN p.Mac = 1 THEN 1 ELSE 0 END) AS Mac,
        SUM(CASE WHEN p.Linux = 1 THEN 1 ELSE 0 END) AS Linux
      FROM Games g
      JOIN Platforms p ON g.PlatformsID = p.PlatformsID
      JOIN ReleaseDate rd ON g.ReleaseDateID = rd.ReleaseDateID
      WHERE rd.ReleaseYear IS NOT NULL
      GROUP BY rd.ReleaseYear
      ORDER BY rd.ReleaseYear;
    `;
    const [rows] = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error("Database query error (Platforms):", err);
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
