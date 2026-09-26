export default function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_3px_18px_-12px_#12392e30] sm:p-7 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
