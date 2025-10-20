import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function TrendingGames() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/trending")
      .then((res) => res.json())
      .then(setData);
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Trending Games</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <XAxis dataKey="ReleaseDate" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="FollowersGain7d" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}