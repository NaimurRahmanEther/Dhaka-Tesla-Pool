// Decorative illustration only; this is not a live map or a suggested route.
export default function RouteArt({ className = '' }) {
  return (
    <svg viewBox="0 0 520 420" fill="none" aria-hidden="true" className={className}>
      <rect x="20" y="20" width="480" height="380" rx="42" fill="#e8eee3" />
      <path
        d="M20 126h480M20 291h480M133 20v380M379 20v380M250 20v380"
        stroke="#fff"
        strokeWidth="22"
      />
      <path
        d="M20 126h480M20 291h480M133 20v380M379 20v380M250 20v380"
        stroke="#d9e1d7"
        strokeWidth="1"
        strokeDasharray="5 8"
      />
      <rect x="44" y="43" width="64" height="59" rx="12" fill="#d6e4c7" />
      <rect x="272" y="151" width="82" height="114" rx="18" fill="#c6d9bb" />
      <rect x="158" y="315" width="67" height="61" rx="12" fill="#d6e4c7" />
      <path
        d="M62 207h72v84h116V126h128v81h74"
        stroke="#184536"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="62" cy="207" r="17" fill="#184536" stroke="white" strokeWidth="7" />
      <circle cx="452" cy="207" r="17" fill="#d5ed9b" stroke="#184536" strokeWidth="7" />
      <g transform="translate(223 172)">
        <rect x="-7" y="-8" width="69" height="104" rx="27" fill="#12392e" opacity=".1" />
        <rect width="54" height="86" rx="20" fill="#fff" stroke="#184536" strokeWidth="3" />
        <path d="m9 24 5-12h26l5 12-6 7H15Z" fill="#184536" />
        <path d="M10 64h34l-4 11H14Z" fill="#d5ed9b" />
        <path d="M8 38v15m38-15v15" stroke="#d9e1d7" strokeWidth="2" />
      </g>
      <circle cx="79" cy="342" r="21" fill="#b7d4ab" />
      <circle cx="434" cy="73" r="22" fill="#b7d4ab" />
      <circle cx="327" cy="346" r="14" fill="#b7d4ab" />
    </svg>
  )
}
