import OgImage, { contentType } from "@/lib/og-image";
import { ogImageStaticParams } from "@/lib/og-image";

export const generateStaticParams = ogImageStaticParams;

export async function GET(
  _request: Request,
  context: { params: Promise<{ locale: string; slug: string }> },
) {
  const response = await OgImage(context);

  return new Response(response.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
