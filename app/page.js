export default function Home() {
  return (
    <div className="home-container">
      <h1 style={{ textAlign: "center", marginBottom: "10px" }}>Welcome to PopReel 🎬</h1>
      <p style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>Discover and share short-form videos, just like TikTok!</p>
      <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
        <a href="/feed" className="explore-button">Explore Videos 🚀</a>
      </div>
    </div>
  );
}
