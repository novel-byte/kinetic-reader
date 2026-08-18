import { useEffect, useState, type ReactNode } from "react";

interface KineticHeadingProps {
  children: ReactNode;
  className?: string;
  /** Perform a one-time soft -> normal settle on mount. */
  settle?: boolean;
  as?: "h1" | "h2" | "h3";
}

const SOFT = '"opsz" 12, "SOFT" 100, "WONK" 1';
const NORMAL = '"opsz" 24, "SOFT" 0, "WONK" 0';

/**
 * Variable-font theater: animates font-variation-settings only, so shapes
 * change without any layout shift. Silently inert if the axes aren't available.
 */
export function KineticHeading({ children, className = "", settle, as = "h1" }: KineticHeadingProps) {
  const Tag = as;
  const [soft, setSoft] = useState(Boolean(settle));

  useEffect(() => {
    if (!settle) return;
    const t = window.setTimeout(() => setSoft(false), 120);
    return () => window.clearTimeout(t);
  }, [settle]);

  return (
    <Tag
      className={`${className} text-balance`}
      onPointerEnter={() => setSoft(true)}
      onPointerLeave={() => setSoft(false)}
      onPointerDown={() => setSoft(true)}
      onPointerUp={() => setSoft(false)}
      style={{
        fontVariationSettings: soft ? SOFT : NORMAL,
        transition: "font-variation-settings 400ms ease",
      }}
    >
      {children}
    </Tag>
  );
}
