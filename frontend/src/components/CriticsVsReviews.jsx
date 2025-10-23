import { useEffect, useState } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

export default function CriticVsReviews() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/critic-vs-reviews")
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error("Critic vs Reviews Fetch Error:", err));
  }, []);

  return (
    <div className="chart-card">
      <h2>Critic Score vs Total Reviews</h2>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey="MetacriticScore" name="Critic Score" />
          <YAxis type="number" dataKey="TotalReviews" name="Total Reviews" />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Scatter data={data} fill="#66c0f4" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}