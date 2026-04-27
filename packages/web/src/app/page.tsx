import Header from "../components/layout/Header";
import LinkGrid from "../components/links/LinkGrid";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <Header />
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
        <LinkGrid />
      </main>
    </div>
  );
}
