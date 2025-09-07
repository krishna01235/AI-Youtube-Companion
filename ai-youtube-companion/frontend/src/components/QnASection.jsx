// frontend/src/components/QnASection.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaQuestion, FaPaperPlane, FaRobot, FaClock } from 'react-icons/fa'
import axios from 'axios'

const QnASection = ({ videoId, isLoading, setIsLoading }) => {
  const [question, setQuestion] = useState('')
  const [qaHistory, setQaHistory] = useState([])
  const [currentTranscript, setCurrentTranscript] = useState(null)

  const handleAskQuestion = async (e) => {
    e.preventDefault()
    if (!question.trim() || isLoading) return

    setIsLoading(true)

    try {
      // Get transcript first if we don't have it
      let transcript = currentTranscript
      if (!transcript) {
        const transcriptResponse = await axios.get(`/api/youtube/transcript/${videoId}`)
        if (transcriptResponse.data.success) {
          transcript = transcriptResponse.data.transcript
          setCurrentTranscript(transcript)
        } else {
          // Use demo transcript
          transcript = `This is a demo transcript for video analysis. In a real implementation, this would contain the actual video transcript.`
          setCurrentTranscript(transcript)
        }
      }

      // Ask the question
      const response = await axios.post('/api/gemini/question', {
        transcript,
        question: question.trim()
      })

      if (response.data.success) {
        const newQA = {
          id: Date.now(),
          ...response.data.answer
        }
        setQaHistory(prev => [newQA, ...prev])
        setQuestion('')
      }
    } catch (error) {
      console.error('Q&A error:', error)
      alert('Failed to get answer. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <FaQuestion className="h-4 w-4 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Ask AI About Video</h3>
      </div>

      {/* Question Input */}
      <form onSubmit={handleAskQuestion} className="mb-6">
        <div className="flex space-x-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about this video..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200"
            disabled={isLoading}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={isLoading || !question.trim()}
            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FaPaperPlane className="h-4 w-4" />
            )}
          </motion.button>
        </div>
      </form>

      {/* Q&A History */}
      <AnimatePresence>
        {qaHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 max-h-96 overflow-y-auto"
          >
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Recent Questions & Answers
            </h4>
            
            {qaHistory.map((qa, index) => (
              <motion.div
                key={qa.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border-l-4 border-green-200 pl-4 pb-4"
              >
                {/* Question */}
                <div className="mb-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <FaQuestion className="h-3 w-3 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">Question:</span>
                  </div>
                  <p className="text-sm text-gray-800 font-medium">
                    {qa.question}
                  </p>
                </div>

                {/* Answer */}
                <div className="mb-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <FaRobot className="h-3 w-3 text-green-600" />
                    <span className="text-sm font-medium text-green-600">AI Answer:</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {qa.answer}
                  </p>
                </div>

                {/* Timestamp */}
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <FaClock className="h-3 w-3" />
                  <span>{formatTime(qa.timestamp)}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {qaHistory.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaQuestion className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">
            Ask questions about the video content and get AI-powered answers based on the transcript.
          </p>
        </div>
      )}
    </motion.div>
  )
}

export default QnASection