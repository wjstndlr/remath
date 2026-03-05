import { ReactNode } from "react";

export function SectionTitle({
  eyebrow,
  title,
  description
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
}) {
  return (
    <div className="space-y-2 text-center">
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-action">
          {eyebrow}
        </p>
      )}
      <h2 className="text-xl sm:text-2xl font-semibold text-primary">
        {title}
      </h2>
      {description && (
        <p className="mx-auto max-w-2xl text-sm text-slate-600">
          {description}
        </p>
      )}
    </div>
  );
}

