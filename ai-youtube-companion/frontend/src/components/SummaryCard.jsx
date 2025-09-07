// frontend/src/components/SummaryCard.jsx
import { motion } from 'framer-motion'
import { FaDownload, FaFilePdf, FaFileAlt, FaRobot, FaClock } from 'react-icons/fa'
import jsPDF from 'jspdf'

const SummaryCard = ({ summary, isLoading }) => {
  // Safe date formatting function
  console.log('Summary object received:', summary);
  console.log('Timestamp value:', summary?.timestamp);
  console.log('Timestamp type:', typeof summary?.timestamp);
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown date'
    
    try {
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) {
        return 'Invalid date'
      }
      return date.toLocaleString()
    } catch (error) {
      return 'Invalid date'
    }
  }

  // Safe date for file operations
  const getSafeDate = () => {
    try {
      const date = summary?.timestamp ? new Date(summary.timestamp) : new Date()
      return isNaN(date.getTime()) ? new Date() : date
    } catch (error) {
      return new Date()
    }
  }

  const downloadTxt = () => {
    const safeDate = getSafeDate()
    const content = `Video Summary: ${summary.videoTitle || 'Untitled'}\n\nGenerated: ${safeDate.toLocaleString()}\n\n${summary.summary || ''}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(summary.videoTitle || 'video').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadPdf = () => {
    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.getWidth()
    const margin = 20
    const maxLineWidth = pageWidth - 2 * margin
    
    // Title
    pdf.setFontSize(16)
    pdf.setFont(undefined, 'bold')
    const title = `Video Summary: ${summary.videoTitle || 'Untitled'}`
    const titleLines = pdf.splitTextToSize(title, maxLineWidth)
    pdf.text(titleLines, margin, 30)
    
    // Timestamp
    pdf.setFontSize(10)
    pdf.setFont(undefined, 'normal')
    const safeDate = getSafeDate()
    const timestamp = `Generated: ${safeDate.toLocaleString()}`
    pdf.text(timestamp, margin, 50)
    
    // Summary content
    pdf.setFontSize(12)
    const summaryLines = pdf.splitTextToSize(summary.summary || 'No summary available', maxLineWidth)
    pdf.text(summaryLines, margin, 70)
    
    // Download
    pdf.save(`${(summary.videoTitle || 'video').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary.pdf`)
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Generating Summary...</h3>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <FaRobot className="h-4 w-4 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">AI Summary</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadTxt}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            title="Download as TXT"
          >
            <FaFileAlt className="h-4 w-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadPdf}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            title="Download as PDF"
          >
            <FaFilePdf className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      {/* Video Title */}
      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
        {summary.videoTitle || 'Untitled Video'}
      </h4>

      {/* Timestamp */}
      <div className="flex items-center space-x-1 text-xs text-gray-500 mb-4">
        <FaClock className="h-3 w-3" />
        <span>{formatTime(summary.timestamp)}</span>
      </div>

      {/* Summary Content */}
      <div className="prose prose-sm max-w-none">
        <div className="text-gray-700 whitespace-pre-wrap">
          {summary.summary || 'No summary available'}
        </div>
      </div>

      {/* Download Section */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Export summary:</span>
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={downloadTxt}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-md transition-colors duration-200 flex items-center space-x-1"
            >
              <FaFileAlt className="h-3 w-3" />
              <span>TXT</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={downloadPdf}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded-md transition-colors duration-200 flex items-center space-x-1"
            >
              <FaFilePdf className="h-3 w-3" />
              <span>PDF</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default SummaryCard
