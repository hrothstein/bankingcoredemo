import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { DollarSign, TrendingUp, Users, AlertCircle, Activity, CreditCard } from 'lucide-react'

function Dashboard({ user }) {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalAccounts: 0,
    totalTransactions: 0,
    totalDeposits: 0,
    activeAlerts: 0,
    systemStatus: 'operational'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      const config = { headers: { Authorization: `Bearer ${token}` } }

      // For demo purposes, using mock data
      // In production, these would be real API calls
      setStats({
        totalCustomers: 50,
        totalAccounts: 156,
        totalTransactions: 1247,
        totalDeposits: 2456789.50,
        activeAlerts: 7,
        systemStatus: 'operational'
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ icon: Icon, title, value, color, subtitle }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 bg-${color}-100 rounded-lg p-3`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">{value}</div>
              {subtitle && (
                <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {subtitle}
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.username}!</h1>
        <p className="mt-2 text-gray-600">Here's your banking system overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={Users}
          title="Total Customers"
          value={stats.totalCustomers}
          color="blue"
          subtitle="12% increase"
        />
        <StatCard
          icon={CreditCard}
          title="Active Accounts"
          value={stats.totalAccounts}
          color="green"
        />
        <StatCard
          icon={Activity}
          title="Transactions Today"
          value={stats.totalTransactions}
          color="purple"
        />
        <StatCard
          icon={DollarSign}
          title="Total Deposits"
          value={`$${stats.totalDeposits.toLocaleString()}`}
          color="indigo"
        />
        <StatCard
          icon={AlertCircle}
          title="Active Alerts"
          value={stats.activeAlerts}
          color="yellow"
        />
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`flex-shrink-0 ${stats.systemStatus === 'operational' ? 'bg-green-100' : 'bg-red-100'} rounded-lg p-3`}>
              <Activity className={`h-6 w-6 ${stats.systemStatus === 'operational' ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">System Status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    stats.systemStatus === 'operational' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {stats.systemStatus === 'operational' ? 'All Systems Operational' : 'Issues Detected'}
                  </span>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-3 px-4 rounded-lg transition duration-150">
            New Customer
          </button>
          <button className="bg-green-50 hover:bg-green-100 text-green-700 font-medium py-3 px-4 rounded-lg transition duration-150">
            Open Account
          </button>
          <button className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium py-3 px-4 rounded-lg transition duration-150">
            Process Transaction
          </button>
          <button className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-medium py-3 px-4 rounded-lg transition duration-150">
            View Reports
          </button>
        </div>
      </div>

      {/* Integration Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Integration Status</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">MuleSoft Connection</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Connected
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Salesforce FSC Sync</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Webhook Delivery</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Operational
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">API Gateway</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Online
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard