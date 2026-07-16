import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { routing } from "@/i18n/routing";

const geistRegular = await readFile(
  join(process.cwd(), "src/app/fonts/Geist-Regular.ttf"),
);
const geistBold = await readFile(
  join(process.cwd(), "src/app/fonts/Geist-Bold.ttf"),
);

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "TokFresh";

const copy: Record<string, { title1: string; title2: string; description: string; stat: string; statDetail: string; features: string[] }> = {
  en: {
    title1: "Automate Your Claude",
    title2: "Token Reset Timing",
    description: "Schedule 5-hour cycles to align with your workday.",
    stat: "+50%",
    statDetail: "more tokens",
    features: ["24/7 Automatic", "Zero Cost", "Secure by Design"],
  },
  ko: {
    title1: "Claude 토큰 리셋",
    title2: "타이밍 자동화",
    description: "5시간 주기를 업무 시간에 맞춰 자동으로 예약하세요.",
    stat: "+50%",
    statDetail: "더 많은 토큰",
    features: ["24시간 자동", "비용 제로", "설계부터 안전"],
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const c = copy[locale] ?? copy.en;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0A0A0B",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            style={{
              color: "#FFFFFF",
              fontSize: 28,
              fontWeight: 700,
              fontFamily: "Geist",
            }}
          >
            TokFresh
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                color: "#FFFFFF",
                fontSize: 64,
                fontWeight: 700,
                fontFamily: "Geist",
                lineHeight: 1.1,
              }}
            >
              {c.title1}
            </span>
            <span
              style={{
                color: "#FFFFFF",
                fontSize: 64,
                fontWeight: 700,
                fontFamily: "Geist",
                lineHeight: 1.1,
              }}
            >
              {c.title2}
            </span>
          </div>
          <span
            style={{
              color: "#8A8A8E",
              fontSize: 26,
              fontWeight: 400,
              fontFamily: "Geist",
            }}
          >
            {c.description}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span
              style={{
                color: "#34D399",
                fontSize: 36,
                fontWeight: 700,
                fontFamily: "Geist",
              }}
            >
              {c.stat}
            </span>
            <span
              style={{
                color: "#6EE7B7",
                fontSize: 22,
                fontWeight: 400,
                fontFamily: "Geist",
              }}
            >
              {c.statDetail}
            </span>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            {c.features.map((f) => (
              <div
                key={f}
                style={{
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 9999,
                  border: "1px solid #2A2A2E",
                  paddingLeft: 16,
                  paddingRight: 16,
                  paddingTop: 8,
                  paddingBottom: 8,
                }}
              >
                <span
                  style={{
                    color: "#8A8A8E",
                    fontSize: 16,
                    fontWeight: 400,
                    fontFamily: "Geist",
                  }}
                >
                  {f}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Geist",
          data: geistRegular,
          weight: 400 as const,
          style: "normal" as const,
        },
        {
          name: "Geist",
          data: geistBold,
          weight: 700 as const,
          style: "normal" as const,
        },
      ],
    },
  );
}
