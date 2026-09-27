import { createContext } from 'react'

// Separate context exports support Fast Refresh and avoid Windows filename collisions.
export const AuthContext = createContext(null)