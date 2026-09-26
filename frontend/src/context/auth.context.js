import { createContext } from 'react'

// The context object lives in its own lowercase file, deliberately named to
// avoid colliding with AuthProvider.jsx. Two reasons:
//
//   1. react-refresh/only-export-components does not like a file that exports
//      both a component and something else, and useAuth needs the context
//      instance from here - not from the provider file.
//   2. The names must not collide case-insensitively. On Windows the files
//      AuthContext.jsx and authContext.js are the same file, which made imports
//      resolve to the wrong one.
export const AuthContext = createContext(null)