import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

export default function Trending() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/trending?limit=15")
      .then(res => res.json())
      .then(raw => {
        const formatted = raw.map(game => {
          const label = `${game.Name} (${game.ReleaseYear})`;
          return {
            label,
            PeakCCU: game.PeakCCU ?? 0,
            date: new Date(
              game.ReleaseYear,
              (game.ReleaseMonth || 1) - 1,
              game.ReleaseDay || 1
            )
          };
        })
        .sort((a, b) => b.date - a.date); // newest first

        setData(formatted.reverse()); // oldest → newest for left→right chart flow
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to load trending data");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="chart-block">Loading trending games...</div>;
  if (error) return <div className="chart-block error">{error}</div>;

  return (
    <div className="chart-block steam-panel">
      <h2 className="chart-title">Trending Games (Peak Player Count Over New Releases)</h2>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2f35" />
          <XAxis
            dataKey="label"
            angle={-40}
            textAnchor="end"
            interval={0}
            tick={{ fontSize: 11, fill: "#b7c0cd" }}
          />
          <YAxis tick={{ fill: "#b7c0cd" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1b2838",
              border: "1px solid #3c4450",
              color: "#fff"
            }}
            formatter={(value) => value.toLocaleString()}
          />
          <Line
            type="monotone"
            dataKey="PeakCCU"
            stroke="#66c0f4"
            strokeWidth={2}
            dot={{ fill: "#66c0f4", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}