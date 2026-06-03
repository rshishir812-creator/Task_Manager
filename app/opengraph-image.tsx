import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "ChoreQuest — Make chores a quest. Not a fight.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  // Embed the final brand mark (transparent shield) as a data URL so Satori
  // renders the real logo in the corner wordmark.
  const markData = await readFile(join(process.cwd(), "public/icons/logo-mark.png"));
  const markSrc = `data:image/png;base64,${markData.toString("base64")}`;

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={markSrc} alt="ChoreQuest" width={44} height={44} />
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
