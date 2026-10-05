import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-20 md:px-8">
      <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">404</p>
      <h1 className="mt-3 font-display text-5xl">Esa página no está en el taller.</h1>
      <Link href="/" className="mt-6 inline-flex min-h-12 items-center underline-offset-4 hover:underline">
        Volver al inicio
      </Link>
    </div>
  );
}
