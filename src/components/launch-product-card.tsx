import { WhatsappLogo } from "@/components/whatsapp-logo";
import { formatQuantities, type LaunchProduct } from "@/lib/launch-products";
import { customQuoteMessage, whatsappHref } from "@/lib/whatsapp";

/** Ficha de un producto de lanzamiento: lo que se puede pedir y un botón para cotizarlo. */
export function LaunchProductCard({ product }: { product: LaunchProduct }) {
  return (
    <article
      id={product.slug}
      className="flex h-full scroll-mt-28 flex-col rounded-[22px] border border-line bg-sheet p-5"
      aria-labelledby={`${product.slug}-titulo`}
    >
      <h3 id={`${product.slug}-titulo`} className="text-lg font-semibold tracking-tight">
        {product.name}
      </h3>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        {product.specs.map((spec) => (
          <div key={spec.label} className="contents">
            <dt className="text-ink-soft">{spec.label}</dt>
            <dd>{spec.value}</dd>
          </div>
        ))}
        <dt className="text-ink-soft">Cantidades</dt>
        <dd>{formatQuantities(product.quantities)}</dd>
        <dt className="text-ink-soft">Producción</dt>
        <dd>{product.leadTime}</dd>
      </dl>
      <div className="mt-auto pt-5">
        <a
          href={whatsappHref(customQuoteMessage(product.name.toLowerCase()))}
          target="_blank"
          rel="noopener noreferrer"
          className="press inline-flex min-h-11 items-center gap-2 rounded-full bg-press px-4 text-sm font-semibold text-white hover:bg-press-deep"
        >
          <WhatsappLogo size={18} />
          Cotizar {product.name.toLowerCase()}
        </a>
      </div>
    </article>
  );
}
