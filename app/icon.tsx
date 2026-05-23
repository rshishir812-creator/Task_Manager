import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0B0F2A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg viewBox="0 0 256 256" width="28" height="28" fill="none">
          <circle cx="128" cy="128" r="80" stroke="#00E5FF" strokeWidth="22" />
          <path
            d="M 82 134 L 118 172 L 210 64"
            stroke="#00E5FF"
            strokeWidth="26"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
