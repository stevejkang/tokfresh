"use client";

import type { ComponentPropsWithoutRef } from "react";
import { Link } from "@/i18n/navigation";

const linkClassName =
  "font-medium text-foreground underline decoration-muted-foreground/40 underline-offset-4 transition-colors hover:decoration-foreground";

export function MdxAnchor(props: ComponentPropsWithoutRef<"a">) {
  const { href, children, ...rest } = props;

  if (href && href.startsWith("/") && !href.startsWith("//")) {
    return (
      <Link href={href} className={linkClassName} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <a
      className={linkClassName}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      href={href}
      {...rest}
    >
      {children}
    </a>
  );
}
