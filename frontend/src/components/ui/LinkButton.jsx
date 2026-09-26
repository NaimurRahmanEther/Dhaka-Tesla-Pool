import { Link } from 'react-router-dom'
const variants = { primary: 'button-primary', secondary: 'button-secondary', light: 'button-light' }
export default function LinkButton({ variant = 'primary', className = '', children, ...props }) {
  return (
    <Link className={`button ${variants[variant]} ${className}`} {...props}>
      {children}
    </Link>
  )
}
