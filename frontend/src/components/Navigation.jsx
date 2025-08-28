import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, CreditCard, ArrowLeftRight, Shield, LogOut, FlaskConical } from 'lucide-react'

function Navigation({ user, onLogout }) {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <CreditCard className="h-8 w-8 text-blue-600 mr-3" />
              <span className="text-xl font-bold text-gray-800">Core Banking</span>
            </div>
            
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/dashboard"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/dashboard')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
              
              <Link
                to="/accounts"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/accounts')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Accounts
              </Link>
              
              <Link
                to="/transactions"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/transactions')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                Transactions
              </Link>
              
              {user?.role === 'ADMIN' && (
                <Link
                  to="/demo"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/demo')
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <FlaskConical className="h-4 w-4 mr-2" />
                  Demo Control
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.username} ({user?.role})
              </span>
              <button
                onClick={onLogout}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation