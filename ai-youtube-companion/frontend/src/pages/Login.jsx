// frontend/src/pages/Login.jsx
import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaGoogle, FaYoutube } from 'react-icons/fa'

const Login = () => {
  const { user, login, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-purple-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto h-20 w-20 bg-white rounded-full flex items-center justify-center mb-6"
          >
            <FaYoutube className="h-10 w-10 text-red-600" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-2">
            AI YouTube Companion
          </h2>
          <p className="text-blue-200 text-lg">
            Summarize and analyze YouTube videos with AI
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20"
        >
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">
                Get Started
              </h3>
              <p className="text-blue-200">
                Sign in with your Google account to access AI-powered video analysis
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={login}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg"
            >
              <FaGoogle className="h-5 w-5 mr-3 text-red-500" />
              Continue with Google
            </motion.button>

            <div className="text-center text-sm text-blue-200">
              <p>By continuing, you agree to our terms of service</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-blue-200"
        >
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-semibold">Search</div>
              <div>Find videos</div>
            </div>
            <div>
              <div className="font-semibold">Summarize</div>
              <div>AI analysis</div>
            </div>
            <div>
              <div className="font-semibold">Q&A</div>
              <div>Ask questions</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Login