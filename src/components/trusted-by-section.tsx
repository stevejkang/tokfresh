import Image from "next/image";
import { CircleHelp } from "lucide-react";
import { getTranslations } from "next-intl/server";

const logos = [
  { name: "Google", src: "/logos/google.png", width: 120, height: 40 },
  { name: "Naver", src: "/logos/naver.png", width: 120, height: 23 },
  { name: "Kakao", src: "/logos/kakao.png", width: 110, height: 34 },
  { name: "Wanted", src: "/logos/wanted.png", width: 120, height: 39 },
];

export async function TrustedBySection() {
  const t = await getTranslations("Landing");

  return (
    <section className="pb-20">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <p className="mb-10 inline-flex items-center gap-1 text-sm text-muted-foreground">
          {t("trustedBy")}
          <span className="group relative">
            <CircleHelp className="h-3.5 w-3.5 cursor-help text-muted-foreground/50" />
            <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md border border-border opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              {t("trustedByTooltip")}
            </span>
          </span>
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
          {logos.map((logo) => (
            <Image
              key={logo.name}
              src={logo.src}
              alt={logo.name}
              width={logo.width}
              height={logo.height}
              className="h-6 w-auto opacity-40 grayscale dark:invert"
              unoptimized
            />
          ))}
        </div>
        <p className="mt-6 text-xs text-muted-foreground/50">
          {t("trustedByMore")}
        </p>
      </div>
    </section>
  );
}
