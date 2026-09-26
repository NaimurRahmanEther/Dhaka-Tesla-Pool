import AppRoutes from '@/routes/AppRoutes'

// App owns nothing on purpose. Every "who can see what" decision lives in the one
// route table, so the whole navigation surface can be read in a single file.
export default function App() {
  return <AppRoutes />
}
