import { ImageResponse } from "next/og";

export const alt = "ReplyMax social preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background: "linear-gradient(135deg, #050505 0%, #171717 55%, #262626 100%)",
          color: "#f5f5f4",
          fontFamily: "Segoe UI, Arial, sans-serif",
          padding: "52px",
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "36px",
            background: "rgba(10,10,10,0.82)",
            padding: "40px",
            gap: "36px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: "58%",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div
                style={{
                  fontSize: 20,
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                  color: "#a1a1aa",
                }}
              >
                ReplyMax
              </div>
              <div
                style={{
                  fontSize: 68,
                  lineHeight: 1.02,
                  fontWeight: 700,
                  letterSpacing: "-0.05em",
                }}
              >
                Cold outreach that gets replies - and clients
              </div>
              <div
                style={{
                  maxWidth: "88%",
                  fontSize: 28,
                  lineHeight: 1.35,
                  color: "#d4d4d8",
                }}
              >
                Generate specific, sendable outbound copy with believable angles,
                follow-ups, and objection replies.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "14px",
                alignItems: "center",
                color: "#d4d4d8",
                fontSize: 21,
              }}
            >
              <div
                style={{
                  display: "flex",
                  padding: "12px 18px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.16)",
                }}
              >
                4 platforms
              </div>
              <div
                style={{
                  display: "flex",
                  padding: "12px 18px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.16)",
                }}
              >
                Send today
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "42%",
              borderRadius: "28px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(24,24,27,0.96)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                padding: "18px 22px",
                color: "#71717a",
                fontSize: 16,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: "#3f3f46",
                }}
              />
              <div
                style={{
                  display: "flex",
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: "#3f3f46",
                }}
              />
              <div
                style={{
                  display: "flex",
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: "#3f3f46",
                }}
              />
              <div style={{ marginLeft: 12 }}>replymax.io</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "18px", padding: "24px" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  borderRadius: "22px",
                  background: "rgba(39,39,42,0.82)",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    color: "#71717a",
                  }}
                >
                  Positioning angle
                </div>
                <div style={{ fontSize: 24, lineHeight: 1.45, color: "#e4e4e7" }}>
                  You are already paying for attention. The leak is the message that
                  fails to turn it into replies.
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  borderRadius: "22px",
                  background: "rgba(39,39,42,0.82)",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    color: "#71717a",
                  }}
                >
                  Opener
                </div>
                <div style={{ fontSize: 22, lineHeight: 1.45, color: "#f4f4f5" }}>
                  Saw you are driving traffic, but the CTA gets buried. I help SaaS
                  teams tighten the message so more of that traffic turns into demos.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
