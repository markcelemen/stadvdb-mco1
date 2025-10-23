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
});

// Report 2: Trending Games (Adapted to Game Releases Over Time) (/api/release-trends)
// Metrics: Game Count, Date (Year/Month/Day)
// Visualization: Line chart (data source)
app.get('/api/release-trends', async (req, res) => {
    const granularity = req.query.granularity || 'year';
    console.log(`GET /api/release-trends (Granularity: ${granularity})`);
    let sql = '';
    let groupBy = '';
    let selectDate = '';

    try {
        switch (granularity) {
            case 'day':
                selectDate = `CONCAT(ReleaseYear, '-', LPAD(ReleaseMonth, 2, '0'), '-', LPAD(ReleaseDay, 2, '0')) AS date`;
                groupBy = 'ReleaseYear, ReleaseMonth, ReleaseDay';
                break;
            case 'month':
                selectDate = `CONCAT(ReleaseYear, '-', LPAD(ReleaseMonth, 2, '0')) AS date`;
                groupBy = 'ReleaseYear, ReleaseMonth';
                break;
            case 'year':
            default:
                selectDate = `ReleaseYear AS year`;
                groupBy = 'ReleaseYear';
                break;
        }

        sql = `
            SELECT ${selectDate}, COUNT(ReleaseDateID) as count
            FROM ReleaseDate
            WHERE ReleaseYear IS NOT NULL AND ReleaseYear BETWEEN 1990 AND 2025 -- Added reasonable year range filter
              ${granularity !== 'year' ? "AND ReleaseMonth IS NOT NULL AND ReleaseMonth BETWEEN 1 AND 12" : ''}
              ${granularity === 'day' ? "AND ReleaseDay IS NOT NULL AND ReleaseDay BETWEEN 1 AND 31" : ''}
            GROUP BY ${groupBy}
            HAVING ${granularity === 'year' ? 'year' : 'date'} IS NOT NULL -- Ensure grouped value isn't null
            ORDER BY ${groupBy} ASC;
        `;

        const [rows] = await pool.query(sql);
        console.log(`GET /api/release-trends - Found ${rows.length} data points`);
        res.json(rows);

    } catch (err) {
        console.error(`Error fetching release trends (granularity ${granularity}):`, err);
        res.status(500).json({ error: 'Failed to fetch release trends', details: err.message });
    }
});

// Report 3: Top-Rated Games (/api/top-rated)
// Metrics: User Score, Metacritic Score
// Visualization: Scatter plot (data source)
app.get('/api/top-rated', async (req, res) => {
    console.log(`GET /api/top-rated`);
    try {
        const [rows] = await pool.query(`
            SELECT
                g.AppName,
                r.Metacritic_Score,
                r.User_Score,
                (r.Positive + r.Negative) AS TotalReviews -- Needed for context, though not plotted directly
            FROM Reviews r
            JOIN Games g ON r.ReviewsID = g.ReviewsID
            WHERE r.Metacritic_Score > 0 AND r.User_Score > 0 -- Ensure both scores exist
              AND (r.Positive + r.Negative) > 20 -- Filter out games with very few reviews
            ORDER BY r.Metacritic_Score DESC -- Optional sort
            LIMIT 100; -- Limit results
        `);
         console.log(`GET /api/top-rated - Found ${rows.length} games`);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching top rated games:', err);
        res.status(500).json({ error: 'Failed to fetch top rated games', details: err.message });
    }
});

// Report 4: Price vs Rating Analysis (/api/price-vs-rating)
// Metrics: Price, Metacritic Score, Reviews (for bubble size)
// Visualization: Bubble chart (data source)
app.get('/api/price-vs-rating', async (req, res) => {
     console.log(`GET /api/price-vs-rating`);
    try {
        const [rows] = await pool.query(`
            SELECT
                g.AppName,
                s.Launch_Price,
                r.Metacritic_Score,
                (r.Positive + r.Negative) AS TotalReviews -- For bubble size
            FROM Sales s
            JOIN Games g ON s.SalesID = g.SalesID
            JOIN Reviews r ON g.ReviewsID = r.ReviewsID
            WHERE s.Launch_Price > 0 AND r.Metacritic_Score > 0 -- Filter out free games or those without user score
              AND (r.Positive + r.Negative) > 10 -- Require some reviews for bubble size
            LIMIT 150; -- Limit results for performance
        `);
        console.log(`GET /api/price-vs-rating - Found ${rows.length} games`);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching price vs rating data:', err);
        res.status(500).json({ error: 'Failed to fetch price vs rating data', details: err.message });
    }
});

// Report 5: Platform Availability Breakdown (/api/platforms-breakdown)
// Metrics: Windows, MacOS, Linux Support
// Visualization: Pie chart (data source - simpler than stacked bar for this data)
app.get('/api/platforms-breakdown', async (req, res) => {
    console.log(`GET /api/platforms-breakdown`);
    try {
        const [rows] = await pool.query(`
            SELECT
                SUM(CASE WHEN Windows = TRUE OR Windows = 'True' THEN 1 ELSE 0 END) AS WindowsCount,
                SUM(CASE WHEN Mac = TRUE OR Mac = 'True' THEN 1 ELSE 0 END) AS MacCount,
                SUM(CASE WHEN Linux = TRUE OR Linux = 'True' THEN 1 ELSE 0 END) AS LinuxCount
            FROM Platforms;
        `); // Checks for boolean TRUE and string 'True' just in case

        if (!rows || rows.length === 0) {
           console.log("GET /api/platforms-breakdown - No data found.");
           return res.json([]);
        }
        const counts = rows[0];
        const formattedData = [
            { platform: 'Windows', count: parseInt(counts.WindowsCount || 0) },
            { platform: 'Mac', count: parseInt(counts.MacCount || 0) }, // Changed from MacOS to Mac
            { platform: 'Linux', count: parseInt(counts.LinuxCount || 0) }
        ];
        console.log(`GET /api/platforms-breakdown - Counts:`, formattedData);
        res.json(formattedData);
    } catch (err) {
        console.error('Error fetching platform breakdown:', err);
        res.status(500).json({ error: 'Failed to fetch platform breakdown', details: err.message });
    }
});


// --- Start Server ---
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});