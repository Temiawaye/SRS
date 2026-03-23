"use client";

export default function Home() {
  return (
    <main>
      <h1>Home</h1>
      <button onClick={() => window.location.href = "/Generate"}>Generate</button>
    </main>
  );
}
