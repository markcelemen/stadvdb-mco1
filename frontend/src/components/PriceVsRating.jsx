import { useEffect, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import "../styles/steam.css";

export default function PriceVsRating() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/price-vs-rating?limit=50")
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.map((item) => ({
          name: item.Name,
          price: item.LaunchPrice,
          score: item.MetacriticScore,
          reviews: item.TotalReviews,
        }));
        setData(formatted);
      })
      .catch((err) => console.error("Error fetching Price vs Rating:", err));
  }, []);

  return (
    <div className="chart-container">
      <h2 className="chart-title">Price vs Critic Score</h2>
      <p className="chart-subtitle">
        Higher priced games do not always equal higher critic scores. Bubble size = number of reviews.
      </p>

      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
          <CartesianGrid stroke="#2a475e" />
          <XAxis
            type="number"
            dataKey="price"
            name="Price ($)"
            stroke="#c7d5e0"
            tick={{ fill: "#c7d5e0" }}
          />
          <YAxis
            type="number"
            dataKey="score"
            name="Metacritic Score"
            stroke="#c7d5e0"
            tick={{ fill: "#c7d5e0" }}
          />
          <ZAxis type="number" dataKey="reviews" range={[60, 400]} name="# of Reviews" />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            contentStyle={{ background: "#1b2838", border: "1px solid #2a475e", color: "#c7d5e0" }}
            formatter={(value, name) => {
              if (name === "price") return [`$${value}`, "Price"];
              if (name === "score") return [value, "Metacritic Score"];
              if (name === "reviews") return [value, "Reviews"];
              return [value, name];
            }}
          />
          <Scatter data={data} fill="#66c0f4" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}