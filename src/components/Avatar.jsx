// Avatar.jsx — reusable circular portrait with initials fallback. The same
// shape used inline in IssueScreen and StatsScreen, lifted out for the new
// tree screens that need member/non-member ring variants.
//
// Props:
//   name       — display name. Initials = first letter of first/last token.
//   photoUrl   — optional image. Falls back to initials if missing.
//   size       — px. Default 32.
//   variant    — 'member' | 'nonmember' | 'plain' (default 'plain' = no ring)
//   className  — additional class, appended
//   ariaHidden — defaults true (the parent label already names this person)

import React from 'react';

function initialsOf(name) {
  const tokens = (name || '').trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return '·';
  if (tokens.length === 1) return tokens[0][0].toUpperCase();
  return (tokens[0][0] + tokens[tokens.length - 1][0]).toUpperCase();
}

function Avatar({
  name,
  photoUrl,
  size = 32,
  variant = 'plain',
  className = '',
  ariaHidden = true,
}) {
  const cls = ['haavatar', `haavatar--${variant}`, className]
    .filter(Boolean).join(' ');
  const style = {
    width: size, height: size,
    fontSize: Math.max(10, Math.round(size * 0.36)),
  };
  return (
    <span
      className={cls}
      style={style}
      aria-hidden={ariaHidden ? 'true' : undefined}
    >
      {photoUrl ? (
        <img className="haavatar__img" src={photoUrl} alt="" />
      ) : (
        <span className="haavatar__initials">{initialsOf(name)}</span>
      )}
    </span>
  );
}

export default Avatar;
