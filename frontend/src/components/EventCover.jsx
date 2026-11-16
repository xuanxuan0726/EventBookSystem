import { useState } from 'react';
import { themeFor } from '../utils/categories.js';

/**
 * Ask image CDNs that support resizing (Unsplash) for a version close to the display size,
 * so a small card thumbnail doesn't download a full-size photo. Other URLs are used as-is.
 */
function sized(url, width) {
  if (!width || !url.startsWith('https://images.unsplash.com/')) return url;
  const u = new URL(url);
  u.searchParams.set('w', String(width));
  return u.toString();
}

/**
 * Event photo. If there is no image (or it fails to load), it falls back to a
 * gradient cover themed by the event's category, so a card never looks broken.
 * `width` = roughly how many CSS pixels wide it is displayed (used to request a smaller file).
 */
export default function EventCover({ event, className = '', width }) {
  const [failed, setFailed] = useState(false);

  if (event.image_url && !failed) {
    return (
      <img
        className={`cover ${className}`}
        src={sized(event.image_url, width && width * 2 /* sharp on high-DPI screens */)}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  const theme = themeFor(event.category);
  return (
    <div
      className={`cover cover-fallback ${className}`}
      style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}
      aria-hidden="true"
    >
      {theme.emoji}
    </div>
  );
}
