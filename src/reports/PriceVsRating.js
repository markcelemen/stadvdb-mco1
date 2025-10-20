import React, { useEffect, useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function PriceVsRating() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/price-vs-rating")
      .then((res) => res.json())
      .then(setData);
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Price vs Rating Analysis</h2>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart>
          <XAxis type="number" dataKey="Price" name="Price" />
          <YAxis type="number" dataKey="UserScore" name="User Score" />
          <ZAxis dataKey="Reviews" range={[60, 400]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Scatter name="Games" data={data} fill="#82ca9d" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}