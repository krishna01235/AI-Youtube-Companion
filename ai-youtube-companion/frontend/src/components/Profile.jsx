// frontend/src/components/Profile.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaUser, FaClock, FaDownload, FaFileAlt, FaFilePdf, FaChevronDown, FaChevronUp } from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext'
import jsPDF from 'jspdf'

const Profile = ({ summaryHistory }) => {
  const { user } = useAuth()
  const [showHistory, setShowHistory] = useState(false)

  const downloadSummaryTxt = (summary) => {
    const content = `Video Summary: ${summary.videoTitle}\n\nGenerated: ${new Date(summary.timestamp).toLocaleString()}\n\n${summary.summary}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${summary.videoTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadSummaryPdf = (summary) => {
    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.getWidth()
    const margin = 20
    const maxLineWidth = pageWidth - 2 * margin
    
    // Title
    pdf.setFontSize(16)
    pdf.setFont(undefined, 'bold')
    const title = `Video Summary: ${summary.videoTitle}`
    const titleLines = pdf.splitTextToSize(title, maxLineWidth)
    pdf.text(titleLines, margin, 30)
    
    // Timestamp
    pdf.setFontSize(10)
    pdf.setFont(undefined, 'normal')
    const timestamp = `Generated: ${new Date(summary.timestamp).toLocaleString()}`
    pdf.text(timestamp, margin, 50)
    
    // Summary content
    pdf.setFontSize(12)
    const summaryLines = pdf.splitTextToSize(summary.summary, maxLineWidth)
    pdf.text(summaryLines, margin, 70)
    
    // Download
    pdf.save(`${summary.videoTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary.pdf`)
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  const truncateTitle = (title, maxLength = 50) => {
    if (title.length <= maxLength) return title
    return title.substring(0, maxLength) + '...'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      {/* User Profile */}
      <div className="flex items-center space-x-4 mb-6">
        <img
          src={user.avatar}
          alt={user.name}
          className="w-12 h-12 rounded-full border-2 border-gray-200"
        />
        <div>
          <h3 className="font-semibold text-gray-900">{user.name}</h3>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{summaryHistory.length}</div>
          <div className="text-xs text-blue-600">Summaries</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {summaryHistory.filter(s => {
              const today = new Date()
              const summaryDate = new Date(s.timestamp)
              return summaryDate.toDateString() === today.toDateString()
            }).length}
          </div>
          <div className="text-xs text-green-600">Today</div>
        </div>
      </div>

      {/* History Section */}
      <div className="border-t border-gray-100 pt-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200"
        >
          <div className="flex items-center space-x-2">
            <FaClock className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-900">Summary History</span>
          </div>
          {showHistory ? (
            <FaChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <FaChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </motion.button>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 space-y-3 max-h-64 overflow-y-auto"
            >
              {summaryHistory.length === 0 ? (
                <div className="text-center py-8">
                  <FaUser className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No summaries yet</p>
                </div>
              ) : (
                summaryHistory.map((summary, index) => (
                  <motion.div
                    key={summary.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          {truncateTitle(summary.videoTitle)}
                        </h4>
                        <div className="flex items-center space-x-1 text-xs text-gray-500 mb-2">
                          <FaClock className="h-3 w-3" />
                          <span>{formatTime(summary.timestamp)}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-1 ml-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => downloadSummaryTxt(summary)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                          title="Download as TXT"
                        >
                          <FaFileAlt className="h-3 w-3" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => downloadSummaryPdf(summary)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                          title="Download as PDF"
                        >
                          <FaFilePdf className="h-3 w-3" />
                        </motion.button>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {summary.summary.substring(0, 100)}...
                    </p>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default Profile