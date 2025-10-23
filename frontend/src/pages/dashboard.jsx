import MostPlayed from "../components/MostPlayed";
import Trending from "../components/Trending";
import CriticVsReviews from "../components/CriticVsReviews";
import PriceVsRating from "../components/PriceVsRating";
import Platforms from "../components/Platforms";

export default function Dashboard() {
  return (
    <div className="dashboard-container">
      <h1 className="page-title">Steam Analytics Dashboard</h1>

      <div className="charts-grid">
        <MostPlayed />
        <Trending />
        <CriticVsReviews />
        <PriceVsRating />
        <Platforms/>
      </div>
    </div>
  );
}
