import React, { useState } from 'react'
import axios from 'axios'
import { Play, RotateCcw, Users, CreditCard, AlertTriangle, Shield } from 'lucide-react'

function DemoControl() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const runScenario = async (scenario) => {
    setLoading(true)
    setMessage('')
    
    try {
      const response = await axios.post(`/api/v1/demo/scenario/${scenario}`, {}, {
        headers: {
          'X-API-Key': 'demo-api-key'
        }
      })
      
      setMessage(`✅ ${response.data.message}`)
    } catch (error) {
      setMessage(`❌ ${error.response?.data?.message || 'Scenario failed'}`)
    } finally {
      setLoading(false)
    }
  }

  const resetDemo = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      await axios.post('/api/v1/demo/reset', {}, {
        headers: {
          'X-API-Key': 'demo-api-key'
        }
      })
      
      setMessage('✅ Demo data reset successfully')
    } catch (error) {
      setMessage(`❌ ${error.response?.data?.message || 'Reset failed'}`)
    } finally {
      setLoading(false)
    }
  }

  const scenarios = [
    {
      id: 'customer-onboarding',
      name: 'Customer Onboarding',
      description: 'Simulate new customer journey with KYC validation',
      icon: Users,
      color: 'blue'
    },
    {
      id: 'loan-origination',
      name: 'Loan Application',
      description: 'Process loan application with credit check',
      icon: CreditCard,
      color: 'green'
    },
    {
      id: 'compliance-alert',
      name: 'Compliance Alert',
      description: 'Trigger AML alert and case creation',
      icon: AlertTriangle,
      color: 'yellow'
    },
    {
      id: 'fraud-detection',
      name: 'Fraud Detection',
      description: 'Simulate suspicious transaction detection',
      icon: Shield,
      color: 'red'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Demo Control Center</h1>
      <p className="text-gray-600 mb-8">Control demo scenarios and system state</p>

      {message && (
        <div className={`mb-8 p-4 rounded-lg ${
          message.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {scenarios.map((scenario) => {
          const IconComponent = scenario.icon
          return (
            <div key={scenario.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <div className={`bg-${scenario.color}-100 p-3 rounded-lg mr-4`}>
                  <IconComponent className={`h-6 w-6 text-${scenario.color}-600`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{scenario.name}</h3>
                  <p className="text-gray-600 text-sm">{scenario.description}</p>
                </div>
              </div>
              <button
                onClick={() => runScenario(scenario.id)}
                disabled={loading}
                className={`w-full bg-${scenario.color}-600 text-white py-2 px-4 rounded-lg hover:bg-${scenario.color}-700 focus:outline-none focus:ring-2 focus:ring-${scenario.color}-500 disabled:opacity-50 flex items-center justify-center`}
              >
                <Play className="h-4 w-4 mr-2" />
                Run Scenario
              </button>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <RotateCcw className="h-6 w-6 text-gray-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Reset Demo Data</h3>
            <p className="text-gray-600 text-sm">Restore system to initial demo state</p>
          </div>
        </div>
        <button
          onClick={resetDemo}
          disabled={loading}
          className="bg-gray-600 text-white py-2 px-6 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 flex items-center"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          {loading ? 'Processing...' : 'Reset Demo Data'}
        </button>
      </div>
    </div>
  )
}

export default DemoControl