'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const onClient = () => window.location.origin;
const onServer = () => '';

/**
 * Shows a link and copies it.
 *
 * The origin is read from the browser rather than baked in at build time, so
 * the link is correct on localhost, on a LAN address a colleague is testing
 * from, and on a real domain later — with no configuration step whose absence
 * would silently produce wrong links.
 *
 * `useSyncExternalStore` rather than an effect: it is given a different
 * snapshot per environment, so React knows the server and client renders
 * legitimately differ instead of treating it as a hydration mismatch, and
 * nothing has to setState during render.
 */
export function CopyField({ label, path }: { label: string; path: string }) {
  const origin = useSyncExternalStore(subscribe, onClient, onServer);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  const url = origin + path;

  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex gap-2">
        <input readOnly value={url} className="field font-mono text-xs" aria-label={label} />
        <button
          type="button"
          className="btn btn-quiet shrink-0 text-sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
            } catch {
              // Clipboard access can be refused — over plain HTTP on a LAN
              // address, for instance. The field is selectable either way, so
              // the link is never unreachable.
              setCopied(false);
            }
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
