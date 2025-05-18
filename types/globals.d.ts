export {}

// Create a type for the roles
export type Roles = 'prompt_admin' | 'member' | 'admin'

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles
    }
  }
}