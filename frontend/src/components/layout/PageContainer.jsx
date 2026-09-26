export default function PageContainer({ className = '', children }) {
  return (
    <div className={'mx-auto w-full max-w-6xl px-4 sm:px-7 lg:px-10 ' + className}>{children}</div>
  )
}
