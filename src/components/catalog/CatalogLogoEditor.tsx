'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  RotateCcw,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import {
  DEFAULT_PLACEMENT,
  type LogoPlacement,
  type LogoVariant,
} from '@/lib/catalog/logo-editor-defaults';

type EditorItem = {
  id: string;
  destRel: string;
  origRel: string | null;
  sourceKind: 'backup' | 'override' | 'dest';
  placement: LogoPlacement | null;
  origUrl: string;
  destUrl: string;
};

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; items: EditorItem[] };

const LOGO_SRC: Record<Exclude<LogoVariant, 'white'>, string> = {
  dark: '/api/catalog/logo-editor/asset?kind=logo&variant=dark',
  light: '/api/catalog/logo-editor/asset?kind=logo&variant=light',
};

function samePlacement(a: LogoPlacement, b: LogoPlacement) {
  return (
    a.logo === b.logo &&
    Math.abs(a.cx - b.cx) < 0.0005 &&
    Math.abs(a.cy - b.cy) < 0.0005 &&
    Math.abs(a.widthFrac - b.widthFrac) < 0.0005 &&
    Math.abs(a.angle - b.angle) < 0.05
  );
}

export function CatalogLogoEditor() {
  const t = useTranslations('promoCatalog.items');
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, LogoPlacement>>({});
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    const response = await fetch('/api/catalog/logo-editor', { cache: 'no-store' });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? `HTTP ${response.status}`);
    }
    const data = (await response.json()) as { items: EditorItem[] };
    return data.items;
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadItems()
      .then((items) => {
        if (cancelled) return;
        const nextDrafts: Record<string, LogoPlacement> = {};
        for (const item of items) {
          nextDrafts[item.id] = item.placement ?? { ...DEFAULT_PLACEMENT };
        }
        setDrafts(nextDrafts);
        setLoad({ status: 'ready', items });
        setSelectedId((current) => current ?? items[0]?.id ?? null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoad({
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to load',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [loadItems]);

  const items = load.status === 'ready' ? load.items : [];
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const placement = selectedId ? drafts[selectedId] ?? DEFAULT_PLACEMENT : DEFAULT_PLACEMENT;
  const savedPlacement = selected?.placement ?? null;
  const dirty = selected
    ? !savedPlacement || !samePlacement(placement, savedPlacement)
    : false;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const name = t.has(`${item.id}.name`) ? t(`${item.id}.name`) : item.id;
      return name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
    });
  }, [items, query, t]);

  const updatePlacement = useCallback(
    (patch: Partial<LogoPlacement>) => {
      if (!selectedId) return;
      setDrafts((prev) => ({
        ...prev,
        [selectedId]: { ...(prev[selectedId] ?? DEFAULT_PLACEMENT), ...patch },
      }));
    },
    [selectedId],
  );

  async function save() {
    if (!selected) return;
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch('/api/catalog/logo-editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selected.id,
          action: 'save',
          placement,
        }),
      });
      const data = (await response.json()) as { error?: string; placement?: LogoPlacement };
      if (!response.ok) throw new Error(data.error ?? 'Save failed');
      const nextItems = await loadItems();
      setLoad({ status: 'ready', items: nextItems });
      setStatus('Зачувано.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function restore() {
    if (!selected) return;
    if (!window.confirm('Да се тргне логото и да се врати празниот mockup?')) return;
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch('/api/catalog/logo-editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, action: 'restore' }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? 'Restore failed');
      const nextItems = await loadItems();
      setLoad({ status: 'ready', items: nextItems });
      setDrafts((prev) => ({ ...prev, [selected.id]: { ...DEFAULT_PLACEMENT } }));
      setStatus('Вратен е празниот mockup.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Restore failed');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!selectedId) return;
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      const step = event.shiftKey ? 0.002 : 0.008;
      const rot = event.shiftKey ? 0.5 : 2;
      const scale = event.shiftKey ? 0.004 : 0.016;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        updatePlacement({ cx: Math.max(0.02, placement.cx - step) });
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        updatePlacement({ cx: Math.min(0.98, placement.cx + step) });
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        updatePlacement({ cy: Math.max(0.02, placement.cy - step) });
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        updatePlacement({ cy: Math.min(0.98, placement.cy + step) });
      } else if (event.key === '[') {
        event.preventDefault();
        updatePlacement({ angle: Math.max(-180, placement.angle - rot) });
      } else if (event.key === ']') {
        event.preventDefault();
        updatePlacement({ angle: Math.min(180, placement.angle + rot) });
      } else if (event.key === '=' || event.key === '+') {
        event.preventDefault();
        updatePlacement({ widthFrac: Math.min(0.95, placement.widthFrac + scale) });
      } else if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        updatePlacement({ widthFrac: Math.max(0.04, placement.widthFrac - scale) });
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void save();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (load.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 text-white">
        Се вчитува…
      </div>
    );
  }

  if (load.status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ink-950 px-6 text-center text-white">
        <p className="text-lg font-semibold">Не може да се отвори уредникот</p>
        <p className="text-sm text-white/70">{load.message}</p>
        <p className="text-sm text-white/50">Најавете се на /admin/login и обидете се повторно.</p>
        <Link href="/admin/login" className="text-sm text-brand-300 underline">
          Админ најава
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-ink-950 text-white">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
            Каталог
          </p>
          <h1 className="text-lg font-semibold">Поставување лого</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/catalog"
            className="rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/70 hover:bg-white/10"
          >
            Каталог
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void restore()}
            disabled={!selected || saving}
            className="border-white/20 bg-transparent text-white hover:bg-white/10"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Без лого
          </Button>
          <Button size="sm" onClick={() => void save()} loading={saving} disabled={!selected}>
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Зачувај
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-72 shrink-0 flex-col border-r border-white/10 bg-black/20">
          <div className="border-b border-white/10 p-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Барај производ…"
                className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-8 pr-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-brand-400"
              />
            </label>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {filtered.map((item) => {
              const name = t.has(`${item.id}.name`) ? t(`${item.id}.name`) : item.id;
              const active = item.id === selectedId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition ${
                    active ? 'bg-brand-600 text-white' : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <img
                    src={item.origUrl}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded object-cover bg-white"
                  />
                  <span className="min-w-0 flex-1 truncate">{name}</span>
                  {item.placement ? (
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? 'bg-white' : 'bg-emerald-400'}`} />
                  ) : null}
                </button>
              );
            })}
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <LogoStage
            key={selected?.id ?? 'none'}
            origUrl={selected ? `${selected.origUrl}&t=1` : null}
            placement={placement}
            onChange={updatePlacement}
          />
          {status ? (
            <p className="border-t border-white/10 px-4 py-2 text-sm text-white/70">{status}</p>
          ) : dirty ? (
            <p className="border-t border-white/10 px-4 py-2 text-sm text-amber-300">
              Незачувани промени — Ctrl+S за зачувување.
            </p>
          ) : (
            <p className="border-t border-white/10 px-4 py-2 text-sm text-white/40">
              Повлечи за да поместиш · агли за големина · горната топка за ротација · тркалце за
              зум.
            </p>
          )}
        </main>

        <aside className="w-72 shrink-0 overflow-y-auto border-l border-white/10 bg-black/20 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
            Лого
          </p>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {(['dark', 'light', 'white'] as const).map((variant) => (
              <button
                key={variant}
                type="button"
                onClick={() => updatePlacement({ logo: variant })}
                className={`rounded-lg px-2 py-2 text-xs font-semibold uppercase tracking-wide ${
                  placement.logo === variant
                    ? 'bg-brand-600 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {variant === 'dark' ? 'Темно' : variant === 'light' ? 'Светло' : 'Бело'}
              </button>
            ))}
          </div>

          <SliderField
            label="Хоризонтала"
            value={placement.cx}
            min={0.02}
            max={0.98}
            step={0.001}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(cx) => updatePlacement({ cx })}
          />
          <SliderField
            label="Вертикала"
            value={placement.cy}
            min={0.02}
            max={0.98}
            step={0.001}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(cy) => updatePlacement({ cy })}
          />
          <SliderField
            label="Големина"
            value={placement.widthFrac}
            min={0.04}
            max={0.9}
            step={0.001}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(widthFrac) => updatePlacement({ widthFrac })}
          />
          <SliderField
            label="Ротација"
            value={placement.angle}
            min={-180}
            max={180}
            step={0.1}
            format={(v) => `${v.toFixed(1)}°`}
            onChange={(angle) => updatePlacement({ angle })}
          />

          <button
            type="button"
            onClick={() => updatePlacement({ ...DEFAULT_PLACEMENT, logo: placement.logo })}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/55 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Ресетирај позиција
          </button>
        </aside>
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="mt-4 block">
      <span className="flex items-center justify-between text-xs font-medium text-white/60">
        {label}
        <span className="tabular-nums text-white/90">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 w-full accent-brand-500"
      />
    </label>
  );
}

function LogoStage({
  origUrl,
  placement,
  onChange,
}: {
  origUrl: string | null;
  placement: LogoPlacement;
  onChange: (patch: Partial<LogoPlacement>) => void;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const modeRef = useRef<'move' | 'resize' | 'rotate' | null>(null);
  const startRef = useRef({ x: 0, y: 0, cx: 0, cy: 0, width: 0, angle: 0 });

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      const mode = modeRef.current;
      const stage = stageRef.current;
      if (!mode || !stage) return;
      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      if (mode === 'move') {
        onChange({
          cx: Math.min(0.98, Math.max(0.02, px)),
          cy: Math.min(0.98, Math.max(0.02, py)),
        });
      } else if (mode === 'resize') {
        const dx = Math.abs(px - startRef.current.cx);
        onChange({ widthFrac: Math.min(0.95, Math.max(0.04, dx * 2)) });
      } else if (mode === 'rotate') {
        const dx = px - startRef.current.cx;
        const dy = py - startRef.current.cy;
        const deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        onChange({ angle: Math.round(deg * 10) / 10 });
      }
    },
    [onChange],
  );

  const endPointer = useCallback(() => {
    modeRef.current = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', endPointer);
  }, [onPointerMove]);

  function begin(mode: 'move' | 'resize' | 'rotate', event: React.PointerEvent) {
    event.preventDefault();
    event.stopPropagation();
    modeRef.current = mode;
    startRef.current = {
      x: event.clientX,
      y: event.clientY,
      cx: placement.cx,
      cy: placement.cy,
      width: placement.widthFrac,
      angle: placement.angle,
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endPointer);
  }

  const logoSrc = placement.logo === 'white' ? LOGO_SRC.light : LOGO_SRC[placement.logo];

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,#1e293b,transparent_65%),linear-gradient(#0b1220,#020617)] p-6">
      {origUrl ? (
        <div
          ref={stageRef}
          className="relative max-h-full max-w-full overflow-hidden rounded-xl bg-white shadow-2xl"
        >
          <img src={origUrl} alt="" className="block max-h-[calc(100vh-9rem)] max-w-full" />
          <div
            className="absolute cursor-move touch-none select-none"
            style={{
              left: `${placement.cx * 100}%`,
              top: `${placement.cy * 100}%`,
              width: `${placement.widthFrac * 100}%`,
              transform: `translate(-50%, -50%) rotate(${placement.angle}deg)`,
            }}
            onPointerDown={(event) => begin('move', event)}
            onWheel={(event) => {
              event.preventDefault();
              const delta = event.deltaY > 0 ? -0.015 : 0.015;
              onChange({
                widthFrac: Math.min(0.95, Math.max(0.04, placement.widthFrac + delta)),
              });
            }}
          >
            <img
              src={logoSrc}
              alt=""
              draggable={false}
              className="pointer-events-none w-full select-none"
              style={placement.logo === 'white' ? { filter: 'brightness(0) invert(1)' } : undefined}
            />
            <span className="pointer-events-none absolute inset-0 rounded-sm ring-1 ring-brand-400/80" />
            <button
              type="button"
              aria-label="Ротирај"
              className="absolute left-1/2 top-0 h-3.5 w-3.5 -translate-x-1/2 -translate-y-6 cursor-grab rounded-full bg-brand-400 ring-4 ring-brand-400/30"
              onPointerDown={(event) => begin('rotate', event)}
            />
            <span className="pointer-events-none absolute left-1/2 top-0 h-6 w-px -translate-x-1/2 -translate-y-6 bg-brand-400/80" />
            <button
              type="button"
              aria-label="Големина"
              className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 cursor-nwse-resize rounded-sm bg-white ring-2 ring-brand-500"
              onPointerDown={(event) => begin('resize', event)}
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-white/50">Изберете производ.</p>
      )}
    </div>
  );
}
