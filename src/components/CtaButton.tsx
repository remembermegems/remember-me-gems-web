import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

const BASE =
  "relative isolate inline-block px-8 py-3 rounded-full font-body font-medium text-warm-white border border-gold " +
  "transition-colors duration-300 ease-out hover:text-cocoa active:text-cocoa " +
  "before:content-[''] before:absolute before:inset-0 before:-z-10 before:rounded-full before:bg-gold before:scale-100 " +
  "before:transition-transform before:duration-300 before:ease-out hover:before:scale-0 active:before:scale-0 " +
  "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-warm-white disabled:hover:before:scale-100";

export function CtaLink({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={`${BASE} ${className}`}>
      {children}
    </Link>
  );
}

export function CtaButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  return (
    <button className={`${BASE} ${className}`} {...props}>
      {children}
    </button>
  );
}
