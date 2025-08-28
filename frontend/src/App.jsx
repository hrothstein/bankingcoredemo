import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Accounts from './pages/Accounts'
import Transactions from './pages/Transactions'
import DemoControl from './pages/DemoControl'
import Navigation from './components/Navigation'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setIsAuthenticated(true)
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setIsAuthenticated(true)
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsAuthenticated(false)
    setUser(null)
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {isAuthenticated && <Navigation user={user} onLogout={handleLogout} />}
        <div className={isAuthenticated ? "pt-16" : ""}>
          <Routes>
            <Route 
              path="/login" 
              element={
                !isAuthenticated ? 
                  <Login onLogin={handleLogin} /> : 
                  <Navigate to="/dashboard" />
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                isAuthenticated ? 
                  <Dashboard user={user} /> : 
                  <Navigate to="/login" />
              } 
            />
            <Route 
              path="/accounts" 
              element={
                isAuthenticated ? 
                  <Accounts user={user} /> : 
                  <Navigate to="/login" />
              } 
            />
            <Route 
              path="/transactions" 
              element={
                isAuthenticated ? 
                  <Transactions user={user} /> : 
                  <Navigate to="/login" />
              } 
            />
            <Route 
              path="/demo" 
              element={
                isAuthenticated && user?.role === 'ADMIN' ? 
                  <DemoControl /> : 
                  <Navigate to="/dashboard" />
              } 
            />
            <Route 
              path="/" 
              element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
            />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App