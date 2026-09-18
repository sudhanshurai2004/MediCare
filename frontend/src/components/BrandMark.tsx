import Link from "next/link";

interface BrandMarkProps {
  compact?: boolean;
  inverse?: boolean;
}

export function BrandMark({ compact = false, inverse = false }: BrandMarkProps) {
  const textColor = inverse ? "text-white" : "text-ink";
  const captionColor = inverse ? "text-blue-100" : "text-slate-500";

  return (
    <Link href="/" className="group inline-flex items-center gap-3 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-medblue">
      <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-medblue shadow-md shadow-blue-900/15 transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105">
        <svg aria-hidden="true" className="h-7 w-7 text-white" viewBox="0 0 32 32" fill="none">
          <path d="M16 5.5c-5.76 0-10.5 4.4-10.5 10.1 0 7.4 10.5 11.9 10.5 11.9s10.5-4.5 10.5-11.9C26.5 9.9 21.76 5.5 16 5.5Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M13.2 10.3h5.6v3.2H22v4.9h-3.2v3.3h-5.6v-3.3H10v-4.9h3.2v-3.2Z" fill="white" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className={`block text-xl font-extrabold tracking-tight ${textColor}`}>MedBridge</span>
          <span className={`block text-[10px] font-bold uppercase tracking-[0.15em] ${captionColor}`}>Reports, made human</span>
        </span>
      )}
    </Link>
  );
}
