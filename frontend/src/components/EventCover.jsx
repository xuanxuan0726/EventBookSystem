import { useState } from 'react';
import { themeFor } from '../utils/categories.js';

/**
 * Event photo. If there is no image (or it fails to load), it falls back to a
 * gradient cover themed by the event's category, so a card never looks broken.
 */
export default function EventCover({ event, className = '' }) {
  const [failed, setFailed] = useState(false);

  if (event.image_url && !failed) {
    return <img className={`cover ${className}`} src={event.image_url} alt="" loading="lazy" onError={() => setFailed(true)} />;
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
