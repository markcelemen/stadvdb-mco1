import React, { useState } from "react";
import MostPlayed from "../reports/MostPlayed";
import TrendingGames from "../reports/TrendingGames";
import TopRated from "../reports/TopRated";
import PriceVsRating from "../reports/PriceVsRating";
import PlatformBreakdown from "../reports/PlatformBreakdown";

export default function Dashboard() {
  const [report, setReport] = useState("mostPlayed");

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Report Dashboard</h1>

      {/* Report selector */}
      <select
        className="border p-2 rounded mb-6"
        value={report}
        onChange={(e) => setReport(e.target.value)}
      >
        <option value="mostPlayed">Most Played Games</option>
        <option value="trending">Trending Games</option>
        <option value="topRated">Top Rated Games</option>
        <option value="priceVsRating">Price vs Rating</option>
        <option value="platformBreakdown">Platform Availability</option>
      </select>

      {/* Conditional rendering */}
      {report === "mostPlayed" && <MostPlayed />}
      {report === "trending" && <TrendingGames />}
      {report === "topRated" && <TopRated />}
      {report === "priceVsRating" && <PriceVsRating />}
      {report === "platformBreakdown" && <PlatformBreakdown />}
    </div>
  );
}