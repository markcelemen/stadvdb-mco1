import React, { useEffect, useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function TopRated() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/top-rated")
      .then((res) => res.json())
      .then(setData);
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Top Rated Games</h2>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart>
          <CartesianGrid />
          <XAxis type="number" dataKey="MetacriticScore" name="Metacritic Score" />
          <YAxis type="number" dataKey="UserScore" name="User Score" />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Scatter name="Games" data={data} fill="#8884d8" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}