import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { CreditCard, DollarSign, AlertCircle } from 'lucide-react'

function Accounts({ user }) {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock accounts data for demo
    setAccounts([
      {
        account_id: '1',
        account_number: '****1234',
        account_type: 'CHECKING',
        product_name: 'Premium Checking',
        balance: 5420.50,
        status: 'ACTIVE'
      },
      {
        account_id: '2', 
        account_number: '****5678',
        account_type: 'SAVINGS',
        product_name: 'High Yield Savings',
        balance: 12750.00,
        status: 'ACTIVE'
      }
    ])
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Accounts</h1>
      
      <div className="grid gap-6">
        {accounts.map(account => (
          <div key={account.account_id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CreditCard className="h-8 w-8 text-blue-600 mr-4" />
                <div>
                  <h3 className="text-lg font-semibold">{account.product_name}</h3>
                  <p className="text-gray-600">{account.account_number}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">${account.balance.toLocaleString()}</p>
                <p className="text-sm text-green-600">{account.status}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Accounts