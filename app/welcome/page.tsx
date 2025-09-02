import React from "react";
import Link from "next/link";

const WelcomePage = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "#0a0a0a",
        color: "#fff",
      }}
    >
      <h1>Welcome!</h1>
      <div style={{ marginTop: 24, display: "flex", gap: 16 }}>
        <Link href="welcome/join-a-club">
          <button
            style={{
              padding: "10px 24px",
              fontSize: "16px",
              borderRadius: "6px",
              border: "none",
              background: "#0070f3",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Join a Club
          </button>
        </Link>
        <Link href="welcome/create-club">
          <button
            style={{
              padding: "10px 24px",
              fontSize: "16px",
              borderRadius: "6px",
              border: "none",
              background: "#28a745",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Create a Club
          </button>
        </Link>
      </div>
    </div>
  );
};

export default WelcomePage;
