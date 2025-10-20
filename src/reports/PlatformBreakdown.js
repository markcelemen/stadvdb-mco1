import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function PlatformBreakdown() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/platforms")
      .then((res) => res.json())
      .then(setData);
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Platform Availability Breakdown</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <XAxis dataKey="Game" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Windows" stackId="a" fill="#8884d8" />
          <Bar dataKey="MacOS" stackId="a" fill="#82ca9d" />
          <Bar dataKey="Linux" stackId="a" fill="#ffc658" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}