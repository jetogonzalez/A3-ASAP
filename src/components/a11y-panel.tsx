"use client";

import { useEffect, useId, useRef, useState } from "react";

/*
 * Panel de accesibilidad: tema, contraste, tamaño del texto, movimiento y
 * enlaces subrayados. Guarda la elección en este navegador y la escribe en
 * <html> como data-*; globals.css hace el resto. El script del <head> en
 * layout.tsx aplica lo guardado antes de pintar.
 *
 * Accesible en sí mismo: se abre con el botón, el foco entra al panel, Escape
 * o un clic afuera lo cierran y el foco vuelve al botón.
 *
 * Es un botón flotante abajo a la derecha: en el encabezado se amontonaba con
 * el buscador y el carrito. La primera visita late un par de veces y muestra
 * un globito que dice para qué sirve; al cerrarlo o abrir el panel no vuelve.
 * En el teléfono espera a que se cierre el aviso de cookies, que ocupa ese
 * espacio (globals.css lo esconde mientras tanto).
 */

const HINT_KEY = "asap-a11y-hint";
export const COOKIES_EVENT = "asap:cookies";

type Settings = {
  theme: "light" | "dark" | "system";
  contrast: "normal" | "high";
  text: "md" | "lg" | "xl";
  motion: "normal" | "reduce";
  links: "normal" | "underline";
};

const DEFAULTS: Settings = { theme: "light", contrast: "normal", text: "md", motion: "normal", links: "normal" };
const STORAGE_KEY = "asap-a11y";

function read(): Settings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") };
  } catch {
    return DEFAULTS;
  }
}

function apply(settings: Settings) {
  const root = document.documentElement;
  const dark =
    settings.theme === "dark" ||
    (settings.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const set = (key: string, value: string | null) => {
    if (value) root.dataset[key] = value;
    else delete root.dataset[key];
  };
  set("theme", dark ? "dark" : null);
  set("contrast", settings.contrast === "high" ? "high" : null);
  set("text", settings.text === "md" ? null : settings.text);
  set("motion", settings.motion === "reduce" ? "reduce" : null);
  set("links", settings.links === "underline" ? "underline" : null);
}

export function A11yButton() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(HINT_KEY)) return;
    } catch {
      return;
    }
    let timer: number | undefined;
    let hide: number | undefined;
    /* Se muestra una sola vez: queda marcado al aparecer y se va solo a los 9 s. */
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        setHint(true);
        try {
          localStorage.setItem(HINT_KEY, "1");
        } catch {
          /* nada */
        }
        hide = window.setTimeout(() => setHint(false), 9000);
      }, 1400);
    };
    const ready = () => document.documentElement.dataset.cookies === "ok" || window.matchMedia("(min-width: 640px)").matches;
    if (ready()) schedule();
    window.addEventListener(COOKIES_EVENT, schedule);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(hide);
      window.removeEventListener(COOKIES_EVENT, schedule);
    };
  }, []);

  function dismissHint() {
    setHint(false);
    try {
      localStorage.setItem(HINT_KEY, "1");
    } catch {
      /* Sin almacenamiento, el globito vuelve en la próxima visita. */
    }
  }

  /* Lo guardado se lee al abrir, no al montar: así el servidor y el cliente pintan lo mismo. */
  function toggle() {
    if (hint) dismissHint();
    if (!open) setSettings(read());
    setOpen((current) => !current);
  }

  function update(partial: Partial<Settings>) {
    const next = { ...settings, ...partial };
    setSettings(next);
    apply(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* Sin almacenamiento igual se aplica en esta visita. */
    }
  }

  function reset() {
    setSettings(DEFAULTS);
    apply(DEFAULTS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nada que borrar */
    }
  }

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("input, button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div className="a11y-fab fixed right-4 bottom-4 z-40 sm:right-5 sm:bottom-5 print:hidden">
      {hint && !open ? (
        <div role="status" className="a11y-hint absolute right-0 bottom-full mb-3 w-[min(17rem,calc(100vw-2rem))] rounded-2xl bg-ink p-3.5 pr-10 text-sm leading-5 text-paper shadow-[0_18px_36px_-18px_rgba(20,20,20,0.6)]">
          <p className="font-semibold">¿Te cuesta leer?</p>
          <p className="mt-0.5 text-paper/80">Aquí cambias el contraste, el tamaño del texto y el modo oscuro.</p>
          <button
            type="button"
            onClick={dismissHint}
            aria-label="Cerrar sugerencia"
            className="absolute top-1.5 right-1.5 grid size-8 cursor-pointer place-items-center rounded-full hover:bg-paper/15"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <span aria-hidden="true" className="absolute -bottom-1.5 right-5 size-3 rotate-45 bg-ink" />
        </div>
      ) : null}
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Accesibilidad"
        title="Accesibilidad"
        onClick={toggle}
        className={`press relative grid size-14 cursor-pointer place-items-center rounded-full bg-brand text-sheet shadow-[0_12px_28px_-10px_rgba(20,20,40,0.55)] ring-4 ring-sheet hover:bg-brand-deep ${hint ? "a11y-pulse" : ""}`}
      >
        <A11yIcon />
      </button>
      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label="Ajustes de accesibilidad"
          className="a11y-panel absolute right-0 bottom-full mb-3 max-h-[calc(100dvh-7rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-2xl border border-line bg-sheet p-4 text-ink shadow-[0_24px_48px_-24px_rgba(20,20,20,0.45)]"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Accesibilidad</h2>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                buttonRef.current?.focus();
              }}
              aria-label="Cerrar"
              className="grid size-9 cursor-pointer place-items-center rounded-full hover:bg-paper-deep"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <Choice
            legend="Tema"
            name="a11y-tema"
            value={settings.theme}
            options={[
              ["light", "Claro"],
              ["dark", "Oscuro"],
              ["system", "Sistema"],
            ]}
            onChange={(theme) => update({ theme: theme as Settings["theme"] })}
          />
          <Choice
            legend="Contraste"
            name="a11y-contraste"
            value={settings.contrast}
            options={[
              ["normal", "Normal"],
              ["high", "Alto"],
            ]}
            hint={settings.contrast === "high" ? "Nivel AAA: texto con contraste de 7:1 o más." : "Nivel AA por defecto."}
            onChange={(contrast) => update({ contrast: contrast as Settings["contrast"] })}
          />
          <Choice
            legend="Tamaño del texto"
            name="a11y-texto"
            value={settings.text}
            options={[
              ["md", "A"],
              ["lg", "A+"],
              ["xl", "A++"],
            ]}
            labels={["Normal", "Grande", "Muy grande"]}
            onChange={(text) => update({ text: text as Settings["text"] })}
          />

          <div className="mt-4 space-y-2">
            <Toggle
              label="Reducir movimiento"
              checked={settings.motion === "reduce"}
              onChange={(on) => update({ motion: on ? "reduce" : "normal" })}
            />
            <Toggle
              label="Subrayar enlaces"
              checked={settings.links === "underline"}
              onChange={(on) => update({ links: on ? "underline" : "normal" })}
            />
          </div>

          <button
            type="button"
            onClick={reset}
            className="mt-4 min-h-11 w-full cursor-pointer rounded-full border border-line text-sm font-semibold hover:border-ink/30"
          >
            Restablecer
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Choice({
  legend,
  name,
  value,
  options,
  labels,
  hint,
  onChange,
}: {
  legend: string;
  name: string;
  value: string;
  options: [string, string][];
  /** Nombre para lectores de pantalla cuando el texto visible es un símbolo (A, A+). */
  labels?: string[];
  hint?: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="mt-4">
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="mt-2 grid gap-1 rounded-xl bg-paper-deep p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map(([id, label], index) => {
          const checked = value === id;
          return (
            <label
              key={id}
              className={`flex min-h-10 cursor-pointer items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-brand ${
                checked ? "bg-sheet text-ink shadow-[0_1px_3px_rgba(0,0,0,0.15)]" : "text-ink-soft hover:text-ink"
              }`}
            >
              <input type="radio" name={name} checked={checked} onChange={() => onChange(id)} className="sr-only" aria-label={labels?.[index]} />
              <span aria-hidden={labels ? true : undefined}>{label}</span>
            </label>
          );
        })}
      </div>
      {hint ? <p className="mt-1.5 text-xs text-ink-soft">{hint}</p> : null}
    </fieldset>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl px-1 text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand">
      {label}
      <input type="checkbox" role="switch" checked={checked} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" />
      <span
        aria-hidden="true"
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-press" : "bg-line"}`}
      >
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[1.375rem]" : "translate-x-0.5"}`} />
      </span>
    </label>
  );
}

/* Figura universal de accesibilidad. */
function A11yIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="7.2" r="1.3" fill="currentColor" stroke="none" />
      <path d="M7 10h10M12 10v4M12 14l-2.5 4.5M12 14l2.5 4.5" />
    </svg>
  );
}
