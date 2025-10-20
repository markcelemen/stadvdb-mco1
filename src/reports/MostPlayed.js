import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function MostPlayed() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/most-played")
      .then((res) => res.json())
      .then(setData);
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Most Played Games</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <XAxis dataKey="Name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="PeakCCU" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}