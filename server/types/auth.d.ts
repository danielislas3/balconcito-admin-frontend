declare module 'h3' {
  interface H3EventContext {
    user?: {
      id: string
      email: string
      name: string
      role: string
    }
  }
}

export {}
