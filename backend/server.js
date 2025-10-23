import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js'; // Assuming db.js exports the pool correctly

dotenv.config(); // Load .env variables

const app = express();
const port = process.env.PORT || 5000; // Use port from .env or default to 5000

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON bodies

// --- API Routes ---

// Basic health check endpoint
app.get('/api/', (req, res) => {
  console.log("GET /api/ - Health check requested"); // Log request
  res.json({ message: 'Backend is running!' });
});

// GET /api/years - Fetches distinct release years
app.get('/api/years', async (req, res) => {
  console.log("GET /api/years - Request received");
  try {
    const [rows] = await pool.query(
      'SELECT DISTINCT ReleaseYear FROM ReleaseDate ORDER BY ReleaseYear DESC' // Query ReleaseDate table
    );
    console.log(`GET /api/years - Found ${rows.length} years`);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching years:', err);
    res.status(500).json({ error: 'Failed to fetch years', details: err.message });
  }
});

// GET /api/most-played - Fetches top games by Peak CCU, optionally filtered by year
app.get('/api/most-played', async (req, res) => {
  const year = req.query.year; // Get year from query param
  console.log(`GET /api/most-played - Request received ${year ? `for year ${year}` : '(all years)'}`);
  try {
    let sql = `
            SELECT g.AppName, p.Peak_CCU
            FROM Playtime p
            JOIN Games g ON p.PlaytimeID = g.PlaytimeID
        `;
    const params = [];

    // Add WHERE clause if year is provided
    if (year && /^\d{4}$/.test(year)) { // Basic validation for year format
      sql += ` JOIN ReleaseDate rd ON g.ReleaseDateID = rd.ReleaseDateID WHERE rd.ReleaseYear = ? `;
      params.push(year);
    }

    sql += ` ORDER BY p.Peak_CCU DESC LIMIT 10 `; // Order and limit

    const [rows] = await pool.query(sql, params);
    console.log(`GET /api/most-played - Found ${rows.length} games`);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching most played games:', err);
    res.status(500).json({ error: 'Failed to fetch most played games', details: err.message });
  }
});

// GET /api/release-trends - Counts game releases by year, month, or day
app.get('/api/release-trends', async (req, res) => {
    const granularity = req.query.granularity || 'year'; // Default to year
    console.log(`GET /api/release-trends - Request received for granularity: ${granularity}`);
    let sql = '';
    let groupBy = '';
    let selectDate = '';

    try {
        switch (granularity) {
            case 'day':
                // Note: Day granularity might be slow/too much data without date range filters
                selectDate = `CONCAT(ReleaseYear, '-', LPAD(ReleaseMonth, 2, '0'), '-', LPAD(ReleaseDay, 2, '0')) AS date`;
                groupBy = 'ReleaseYear, ReleaseMonth, ReleaseDay';
                break;
            case 'month':
                selectDate = `CONCAT(ReleaseYear, '-', LPAD(ReleaseMonth, 2, '0')) AS date`;
                groupBy = 'ReleaseYear, ReleaseMonth';
                break;
            case 'year':
            default: // Default to year
                selectDate = `ReleaseYear AS year`; // Select year directly for year granularity
                groupBy = 'ReleaseYear';
                break;
        }

        // Ensure date components are not NULL before grouping
        sql = `
            SELECT ${selectDate}, COUNT(*) as count
            FROM ReleaseDate
            WHERE ReleaseYear IS NOT NULL AND ReleaseYear != ''
              ${granularity !== 'year' ? "AND ReleaseMonth IS NOT NULL AND ReleaseMonth != ''" : ''}
              ${granularity === 'day' ? "AND ReleaseDay IS NOT NULL AND ReleaseDay != ''" : ''}
            GROUP BY ${groupBy}
            ORDER BY ${groupBy} ASC;
        `;

        const [rows] = await pool.query(sql);
        console.log(`GET /api/release-trends - Found ${rows.length} data points for ${granularity}`);
        res.json(rows);

    } catch (err) {
        console.error(`Error fetching release trends for granularity ${granularity}:`, err);
        res.status(500).json({ error: 'Failed to fetch release trends', details: err.message });
    }
});


// GET /api/platforms-breakdown - Counts games per platform
app.get('/api/platforms-breakdown', async (req, res) => {
    console.log(`GET /api/platforms-breakdown - Request received`);
    try {
        // Correctly query and aggregate counts for boolean columns
        const [rows] = await pool.query(`
            SELECT
                SUM(CASE WHEN Windows = TRUE THEN 1 ELSE 0 END) AS WindowsCount,
                SUM(CASE WHEN Mac = TRUE THEN 1 ELSE 0 END) AS MacCount,
                SUM(CASE WHEN Linux = TRUE THEN 1 ELSE 0 END) AS LinuxCount
            FROM Platforms;
        `);

        // Check if rows[0] exists
        if (!rows || rows.length === 0) {
           console.log("GET /api/platforms-breakdown - No data found in Platforms table.");
           return res.json([]);
        }

        const counts = rows[0];

        // Format the response as expected by the frontend Pie chart
        const formattedData = [
            { platform: 'Windows', count: parseInt(counts.WindowsCount || 0) },
            { platform: 'Mac', count: parseInt(counts.MacCount || 0) },
            { platform: 'Linux', count: parseInt(counts.LinuxCount || 0) }
        ];
        console.log(`GET /api/platforms-breakdown - Counts:`, formattedData);
        res.json(formattedData);
    } catch (err) {
        console.error('Error fetching platform breakdown:', err);
        res.status(500).json({ error: 'Failed to fetch platform breakdown', details: err.message });
    }
});


// GET /api/top-rated - Fetches top games by Metacritic/User Score
app.get('/api/top-rated', async (req, res) => {
    console.log(`GET /api/top-rated - Request received`);
    try {
        // Select AppName, scores, and calculate TotalReviews
        const [rows] = await pool.query(`
            SELECT
                g.AppName,
                r.Metacritic_Score,
                r.User_Score,
                (r.Positive + r.Negative) AS TotalReviews
            FROM Reviews r
            JOIN Games g ON r.ReviewsID = g.ReviewsID
            WHERE (r.Positive + r.Negative) > 50 -- Filter out games with few reviews
              AND r.Metacritic_Score > 0 -- Ensure Metacritic score exists
            ORDER BY r.Metacritic_Score DESC, r.User_Score DESC
            LIMIT 50;
        `);
         console.log(`GET /api/top-rated - Found ${rows.length} games`);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching top rated games:', err);
        res.status(500).json({ error: 'Failed to fetch top rated games', details: err.message });
    }
});


// GET /api/price-vs-rating - Fetches game prices vs user score
app.get('/api/price-vs-rating', async (req, res) => {
     console.log(`GET /api/price-vs-rating - Request received`);
    try {
        // Select necessary columns including TotalReviews
        const [rows] = await pool.query(`
            SELECT
                g.AppName,
                s.Launch_Price,
                r.User_Score,
                (r.Positive + r.Negative) AS TotalReviews
            FROM Sales s
            JOIN Games g ON s.SalesID = g.SalesID
            JOIN Reviews r ON g.ReviewsID = r.ReviewsID
            WHERE s.Launch_Price > 0 AND r.User_Score > 0 -- Filter out free games or those without user score
            LIMIT 100; -- Limit results for performance
        `);
        console.log(`GET /api/price-vs-rating - Found ${rows.length} games`);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching price vs rating data:', err);
        res.status(500).json({ error: 'Failed to fetch price vs rating data', details: err.message });
    }
});

// --- Start Server ---
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});