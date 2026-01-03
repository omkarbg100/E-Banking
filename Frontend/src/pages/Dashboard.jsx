import React from 'react'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user, logout } = useAuth()
  return (
    <div className="page">
      <h2>Dashboard</h2>
      <p>Welcome, {user?.name || 'User'}</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
