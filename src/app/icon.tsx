import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
          borderRadius: 96,
        }}
      >
        {/* Traffic light */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#1e293b",
            borderRadius: 24,
            padding: "24px 32px",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#ef4444",
            }}
          />
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#eab308",
            }}
          />
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#22c55e",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
