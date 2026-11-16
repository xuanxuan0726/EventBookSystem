// Visual theme per category: used for chips and for the fallback cover when an event has no photo.
export const CATEGORY_THEME = {
  Music:      { emoji: '🎵', from: '#7c3aed', to: '#db2777' },
  Conference: { emoji: '🎤', from: '#0e7490', to: '#1e3a8a' },
  Workshop:   { emoji: '🛠️', from: '#0f766e', to: '#65a30d' },
  Networking: { emoji: '🤝', from: '#b45309', to: '#be123c' },
  Sports:     { emoji: '🏃', from: '#16a34a', to: '#0369a1' },
  Arts:       { emoji: '🎨', from: '#c026d3', to: '#f59e0b' },
  Comedy:     { emoji: '😂', from: '#ea580c', to: '#facc15' },
  Other:      { emoji: '✨', from: '#475569', to: '#0f172a' },
};

export const themeFor = (category) => CATEGORY_THEME[category] || CATEGORY_THEME.Other;
