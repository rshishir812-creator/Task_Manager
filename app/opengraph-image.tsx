import { ImageResponse } from "next/og";

export const alt = "ChoreQuest — Make chores a quest. Not a fight.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0B0F2A",
          color: "#F5F7FF",
          display: "flex",
          flexDirection: "column",
          padding: "64px 80px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* accent vignette */}
        <div
          style={{
            position: "absolute",
            top: -200,
            left: -200,
            width: 700,
            height: 700,
            borderRadius: 9999,
            background: "radial-gradient(closest-side, rgba(0,229,255,0.22), transparent)",
          }}
        />

        {/* top wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <svg viewBox="0 0 256 256" width="36" height="36" fill="none">
            <circle cx="128" cy="128" r="80" stroke="#00E5FF" strokeWidth="22" />
            <path
              d="M 82 134 L 118 172 L 210 64"
              stroke="#00E5FF"
              strokeWidth="26"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div
            style={{
              fontSize: 18,
              letterSpacing: 6,
              fontWeight: 700,
              color: "#A0A8C8",
            }}
          >
            CHOREQUEST
          </div>
        </div>

        {/* hero */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontSize: 110,
              fontWeight: 900,
              letterSpacing: -3,
              lineHeight: 1,
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            <span>Make chores&nbsp;</span>
            <span style={{ color: "#00E5FF" }}>a quest.</span>
            <span>&nbsp;Not a fight.</span>
          </div>
          <div
            style={{
              marginTop: 32,
              fontSize: 28,
              color: "#A0A8C8",
              lineHeight: 1.3,
              maxWidth: 900,
            }}
          >
            Daily habits become a game your kids actually want to play.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
