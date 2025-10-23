import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Platforms() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/platforms")
      .then((res) => res.json())
      .then((data) => setData(data))
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  return (
    <div className="chart-card">
      <h2>Platform Support by Release Year</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <XAxis dataKey="ReleaseYear" stroke="#c7d5e0" />
          <YAxis stroke="#c7d5e0" />
          <Tooltip
            contentStyle={{ backgroundColor: "#171a21", border: "1px solid #2a475e", color: "#c7d5e0" }}
          />
          <Legend />
          <Bar dataKey="Windows" stackId="a" fill="#66c0f4" />
          <Bar dataKey="Mac" stackId="a" fill="#a4d007" />
          <Bar dataKey="Linux" stackId="a" fill="#d94141" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}