import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js'; 

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


// Basic health check
app.get('/api/', (req, res) => {
  console.log("GET /api/ - Health check");
  res.json({ message: 'Backend is running!' });
});

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

// Report 1: Most Played Games (with missing data handled)
// Report 1: Most Played Games (no nulls)
app.get('/api/most-played', async (req, res) => {
  const year = req.query.year;
  console.log(`GET /api/most-played ${year ? `(Year: ${year})` : ''}`);

  try {
    const [rows] = await pool.query(`
      SELECT 
          rd.ReleaseYear AS ReleaseYear,
          CASE 
            WHEN pl.Windows = 1 THEN 'Windows'
            WHEN pl.Mac = 1 THEN 'Mac'
            WHEN pl.Linux = 1 THEN 'Linux'
            ELSE 'Other'
          END AS Platform,
          g.AppName AS GameName,
          SUM(p.Peak_CCU) AS TotalPeakUsers,
          ROUND(AVG(p.AvgPlaytimeForever), 2) AS AvgPlaytime
      FROM Games g
      JOIN Playtime p ON g.PlaytimeID = p.PlaytimeID
      JOIN ReleaseDate rd ON g.ReleaseDateID = rd.ReleaseDateID
      JOIN Platforms pl ON g.PlatformsID = pl.PlatformsID
      WHERE p.Peak_CCU > 0
      ${year && /^\d{4}$/.test(year) ? 'AND rd.ReleaseYear = ?' : ''}
      GROUP BY rd.ReleaseYear, Platform, g.AppName
      ORDER BY TotalPeakUsers DESC
      LIMIT 50;
    `, year && /^\d{4}$/.test(year) ? [year] : []);

    res.json(rows);
  } catch (err) {
    console.error('Error fetching most played games:', err);
    res.status(500).json({ error: 'Failed to fetch most played games', details: err.message });
  }
});

// Report 2: Trending Games 
app.get('/api/trending-games', async (req, res) => {
  console.log('GET /api/trending-games');
  try {
    const [rows] = await pool.query(`
      SELECT 
          COALESCE(rd.ReleaseYear, 'ALL YEARS') AS ReleaseYear,
          COALESCE(rd.ReleaseMonth, 'ALL MONTHS') AS ReleaseMonth,
          COUNT(DISTINCT g.AppName) AS GamesReleased,
          SUM(p.Peak_CCU) AS TotalPeakUsers
      FROM Games g
      JOIN Playtime p ON g.PlaytimeID = p.PlaytimeID
      JOIN ReleaseDate rd ON g.ReleaseDateID = rd.ReleaseDateID
      WHERE rd.ReleaseYear BETWEEN 2000 AND 2025
      GROUP BY rd.ReleaseYear, rd.ReleaseMonth WITH ROLLUP
      ORDER BY rd.ReleaseYear ASC, rd.ReleaseMonth ASC;
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching trending games:', err);
    res.status(500).json({ error: 'Failed to fetch trending games', details: err.message });
  }
});


// Report 3: Sales Revenue
app.get('/api/sales-revenue', async (req, res) => {
  console.log('GET /api/sales-revenue');

  try {
    const [rows] = await pool.query(`
      SELECT
        SUM(CASE WHEN pl.Windows=1 AND s.Launch_Price>0 AND s.Estimated_Owners>0 THEN s.Launch_Price * s.Estimated_Owners ELSE 0 END) AS WindowsRevenue,
        SUM(CASE WHEN pl.Mac=1    AND s.Launch_Price>0 AND s.Estimated_Owners>0 THEN s.Launch_Price * s.Estimated_Owners ELSE 0 END) AS MacRevenue,
        SUM(CASE WHEN pl.Linux=1  AND s.Launch_Price>0 AND s.Estimated_Owners>0 THEN s.Launch_Price * s.Estimated_Owners ELSE 0 END) AS LinuxRevenue
      FROM Games g
      JOIN Sales s ON g.SalesID = s.SalesID
      JOIN Platforms pl ON g.PlatformsID = pl.PlatformsID;
    `);

    const sums = (rows && rows[0]) ? rows[0] : {};
    const response = [
      { Platform: 'Windows', EstimatedRevenue: Number(sums.WindowsRevenue) || 0 },
      { Platform: 'Mac',     EstimatedRevenue: Number(sums.MacRevenue) || 0 },
      { Platform: 'Linux',   EstimatedRevenue: Number(sums.LinuxRevenue) || 0 }
    ];

    res.json(response);
  } catch (err) {
    console.error('Error fetching sales revenue:', err);
    res.status(500).json({ error: 'Failed to fetch sales revenue', details: err.message });
  }
});


// Report 4: Price vs Metacritic Score (/api/price-vs-rating)
app.get('/api/price-vs-rating', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
          s.Launch_Price AS price,
          r.Metacritic_Score AS metacritic
      FROM Games g
      JOIN Sales s ON g.SalesID = s.SalesID
      JOIN Reviews r ON g.ReviewsID = r.ReviewsID
      WHERE s.Launch_Price IS NOT NULL
        AND r.Metacritic_Score IS NOT NULL
      LIMIT 500;
    `);

    res.json(rows);
  } catch (err) {
    console.error('Error fetching Price vs Rating data:', err);
    res.status(500).json({ error: 'Failed to fetch Price vs Rating data', details: err.message });
  }
});

// Report 5: Platform Availability Breakdown 
app.get('/api/platforms-breakdown', async (req, res) => {
  console.log('GET /api/platforms-breakdown');
  try {
    const [rows] = await pool.query(`
      SELECT
          COALESCE(rd.ReleaseYear, 'ALL YEARS') AS ReleaseYear,
          SUM(pl.Windows) AS WindowsCount,
          SUM(pl.Mac) AS MacCount,
          SUM(pl.Linux) AS LinuxCount,
          COUNT(*) AS TotalGames
      FROM Games g
      JOIN Platforms pl ON g.PlatformsID = pl.PlatformsID
      JOIN ReleaseDate rd ON g.ReleaseDateID = rd.ReleaseDateID
      GROUP BY rd.ReleaseYear WITH ROLLUP
      ORDER BY rd.ReleaseYear ASC;
    `);

    res.json(rows);
  } catch (err) {
    console.error('Error fetching platform breakdown:', err);
    res.status(500).json({ error: 'Failed to fetch platform breakdown', details: err.message });
  }
});



// --- Start Server ---
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});