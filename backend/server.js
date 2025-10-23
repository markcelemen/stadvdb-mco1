import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js'; // Ensure db.js exports the pool correctly

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- API Routes ---

// Basic health check
app.get('/api/', (req, res) => {
  console.log("GET /api/ - Health check");
  res.json({ message: 'Backend is running!' });
});

// GET /api/years - Fetches distinct release years for filtering
app.get('/api/years', async (req, res) => {
  console.log("GET /api/years");
  try {
    const [rows] = await pool.query(
      'SELECT DISTINCT ReleaseYear FROM ReleaseDate WHERE ReleaseYear IS NOT NULL AND ReleaseYear != "" ORDER BY ReleaseYear DESC'
    );
    console.log(`GET /api/years - Found ${rows.length} years`);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching years:', err);
    res.status(500).json({ error: 'Failed to fetch years', details: err.message });
  }
});

// Report 1: Most Played Games (/api/most-played)
// Metrics: Peak CCU, Average Playtime
// Visualization: Bar chart (data source)
app.get('/api/most-played', async (req, res) => {
  const year = req.query.year; // Optional year filter
  console.log(`GET /api/most-played ${year ? `(Year: ${year})` : ''}`);
  try {
    let sql = `
      SELECT
        g.AppName,
        p.Peak_CCU,
        p.AvgPlaytimeForever
      FROM Playtime p
      JOIN Games g ON p.PlaytimeID = g.PlaytimeID
      LEFT JOIN ReleaseDate rd ON g.ReleaseDateID = rd.ReleaseDateID
    `;
    const params = [];
    let whereClause = ' WHERE p.Peak_CCU > 0 ';

    if (year && /^\d{4}$/.test(year)) {
      whereClause += ` AND rd.ReleaseYear = ? `;
      params.push(year);
    }
    sql += whereClause + ` ORDER BY p.Peak_CCU DESC LIMIT 10 `;

    const [rows] = await pool.query(sql, params);
    console.log(`GET /api/most-played - Found ${rows.length} games`);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching most played games:', err);
    res.status(500).json({ error: 'Failed to fetch most played games', details: err.message });
  }
