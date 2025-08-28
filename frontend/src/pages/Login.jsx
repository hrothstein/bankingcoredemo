import React, { useState } from 'react'
import axios from 'axios'
import { CreditCard, Lock, User } from 'lucide-react'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post('/api/v1/auth/login', {
        username,
        password
      })

      if (response.data.status === 'success') {
        onLogin(response.data.token, response.data.user)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const fillDemoCredentials = (role) => {
    if (role === 'admin') {
      setUsername('admin')
      setPassword('admin123')
    } else {
      setUsername('john.smith0')
      setPassword('demo123')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="bg-blue-600 p-3 rounded-full">
            <CreditCard className="h-8 w-8 text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Core Banking Demo</h1>
        <p className="text-center text-gray-600 mb-8">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3 text-center">Quick login with demo accounts:</p>
          <div className="flex space-x-2">
            <button
              onClick={() => fillDemoCredentials('admin')}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 text-sm"
            >
              Admin User
            </button>
            <button
              onClick={() => fillDemoCredentials('customer')}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 text-sm"
            >
              Customer User
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login