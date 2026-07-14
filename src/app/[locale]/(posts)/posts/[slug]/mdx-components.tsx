import Image from "next/image";
import type { ComponentPropsWithoutRef, JSX } from "react";

function Heading2(props: ComponentPropsWithoutRef<"h2">) {
  return (
    <h2
      className="mt-12 mb-4 text-2xl font-semibold tracking-tight text-foreground"
      {...props}
    />
  );
}

function Heading3(props: ComponentPropsWithoutRef<"h3">) {
  return (
    <h3
      className="mt-8 mb-3 text-xl font-semibold tracking-tight text-foreground"
      {...props}
    />
  );
}

function Paragraph(props: ComponentPropsWithoutRef<"p">) {
  return (
    <p
      className="mb-6 text-lg leading-relaxed text-muted-foreground"
      {...props}
    />
  );
}

function InlineCode(props: ComponentPropsWithoutRef<"code">) {
  return (
    <code
      className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.875em] text-foreground"
      {...props}
    />
  );
}

function PreBlock(props: ComponentPropsWithoutRef<"pre">) {
  return (
    <pre
      className="mb-6 overflow-x-auto rounded-lg border border-border bg-muted p-4 font-mono text-sm leading-relaxed"
      {...props}
    />
  );
}

function Anchor(props: ComponentPropsWithoutRef<"a">) {
  return (
    <a
      className="font-medium text-foreground underline decoration-muted-foreground/40 underline-offset-4 transition-colors hover:decoration-foreground"
      target={props.href?.startsWith("http") ? "_blank" : undefined}
      rel={props.href?.startsWith("http") ? "noopener noreferrer" : undefined}
      {...props}
    />
  );
}

function UnorderedList(props: ComponentPropsWithoutRef<"ul">) {
  return (
    <ul
      className="mb-6 list-disc space-y-2 pl-6 text-lg leading-relaxed text-muted-foreground marker:text-muted-foreground/50"
      {...props}
    />
  );
}

function OrderedList(props: ComponentPropsWithoutRef<"ol">) {
  return (
    <ol
      className="mb-6 list-decimal space-y-2 pl-6 text-lg leading-relaxed text-muted-foreground marker:text-muted-foreground/50"
      {...props}
    />
  );
}

function ListItem(props: ComponentPropsWithoutRef<"li">) {
  return <li className="pl-1" {...props} />;
}

function Blockquote(props: ComponentPropsWithoutRef<"blockquote">) {
  return (
    <blockquote
      className="mb-6 border-l-2 border-border pl-6 italic text-muted-foreground"
      {...props}
    />
  );
}

function Table(props: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="mb-6 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm" {...props} />
    </div>
  );
}

function TableHead(props: ComponentPropsWithoutRef<"thead">) {
  return <thead className="border-b border-border bg-muted/50" {...props} />;
}

function TableBody(props: ComponentPropsWithoutRef<"tbody">) {
  return <tbody className="divide-y divide-border" {...props} />;
}

function TableRow(props: ComponentPropsWithoutRef<"tr">) {
  return <tr className="transition-colors hover:bg-muted/30" {...props} />;
}

function TableHeader(props: ComponentPropsWithoutRef<"th">) {
  return (
    <th
      className="px-4 py-3 text-left font-semibold text-foreground"
      {...props}
    />
  );
}

function TableCell(props: ComponentPropsWithoutRef<"td">) {
  return (
    <td
      className="px-4 py-3 text-muted-foreground"
      {...props}
    />
  );
}

function MdxImage(props: ComponentPropsWithoutRef<"img">) {
  if (!props.src || typeof props.src !== "string") return null;

  return (
    <span className="my-8 block overflow-hidden rounded-lg">
      <Image
        src={props.src}
        alt={props.alt ?? ""}
        width={1200}
        height={630}
        className="h-auto w-full"
      />
    </span>
  );
}

export const mdxComponents: Record<string, (props: Record<string, unknown>) => JSX.Element | null> = {
  h2: Heading2,
  h3: Heading3,
  p: Paragraph,
  code: InlineCode,
  pre: PreBlock,
  a: Anchor,
  ul: UnorderedList,
  ol: OrderedList,
  li: ListItem,
  blockquote: Blockquote,
  img: MdxImage,
  table: Table,
  thead: TableHead,
  tbody: TableBody,
  tr: TableRow,
  th: TableHeader,
  td: TableCell,
};
