// The one place a page gets its max width and horizontal padding. No page sets
// its own max-w-* - they just compose <PageContainer> and choose their own
// vertical spacing. Keeps the app's column width identical everywhere.
export default function PageContainer({ className = '', children }) {
  return (
    <div className={`mx-auto w-full max-w-5xl px-6 ${className}`}>{children}</div>
  )
}