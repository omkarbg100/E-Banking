import React from 'react'
import { AuthProvider } from './context/AuthContext'
import AppRoutes from './routes/AppRoutes'
import { AccountProvider } from './context/AccountContext'

function App() {
  return (
    <AuthProvider>
      <AccountProvider>
      <AppRoutes/>
      </AccountProvider>
    </AuthProvider>
  )
}

export default App
