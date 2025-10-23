import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

export default function MostPlayed() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/most-played?limit=10")
      .then((res) => res.json())
      .then((raw) => {
        const filtered = raw.filter(
          (item) => item && item.Name && item.PeakCCU != null
        );
        setData(filtered);
      })
      .catch((err) => console.error("Error fetching most played:", err));
  }, []);

  return (
    <div className="chart-card">
      <h2>Most Played Games (Peak CCU)</h2>

      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="Name" type="category" width={120} />
          <Tooltip />
          <Bar dataKey="PeakCCU" name="Peak CCU" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}