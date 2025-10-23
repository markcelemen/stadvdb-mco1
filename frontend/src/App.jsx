import { useState } from 'react';

function App() {
  const [activeTab, setActiveTab] = useState("most-played");

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">STEAM DASHBOARD</div>

        <nav className="nav">
          <button onClick={() => setActiveTab("most-played")}>Most Played</button>
          <button onClick={() => setActiveTab("trending")}>Trending</button>
          <button onClick={() => setActiveTab("top-rated")}>Top Rated</button>
          <button onClick={() => setActiveTab("price-rating")}>Price vs Rating</button>
          <button onClick={() => setActiveTab("platforms")}>Platforms</button>
        </nav>
      </header>

      <main className="content">
        <h1>{activeTab.toUpperCase()}</h1>
        <p>Chart will load here soon...</p>
      </main>
    </div>
  );
}

export default App;