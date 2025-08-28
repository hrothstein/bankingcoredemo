import React, { useState, useEffect } from 'react'
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'

function Transactions({ user }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock transaction data for demo
    setTransactions([
      {
        transaction_id: '1',
        type: 'DEPOSIT',
        amount: 2500.00,
        description: 'Salary Deposit',
        date: '2024-01-15',
        status: 'COMPLETED'
      },
      {
        transaction_id: '2',
        type: 'WITHDRAWAL',
        amount: 150.00,
        description: 'ATM Withdrawal',
        date: '2024-01-14',
        status: 'COMPLETED'
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Transactions</h1>
      
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {transactions.map(transaction => (
            <div key={transaction.transaction_id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                {transaction.type === 'DEPOSIT' ? (
                  <ArrowDownLeft className="h-5 w-5 text-green-500 mr-3" />
                ) : (
                  <ArrowUpRight className="h-5 w-5 text-red-500 mr-3" />
                )}
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-gray-600">{transaction.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${
                  transaction.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'DEPOSIT' ? '+' : '-'}${transaction.amount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">{transaction.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Transactions