// frontend/src/components/VideoPlayer.jsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import ReactPlayer from 'react-player'
import { FaPlay, FaPause, FaRobot, FaClock, FaUser } from 'react-icons/fa'
import axios from 'axios'

const VideoPlayer = ({ video, onSummaryGenerated, isLoading, setIsLoading }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [transcript, setTranscript] = useState(null)
  const [transcriptLoading, setTranscriptLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSummarize = async () => {
    setIsLoading(true)
    setTranscriptLoading(true)
    setError(null)

    try {
      console.log('🎬 Starting summarization for video:', video.id)
      
      // First, get the transcript
      const transcriptResponse = await axios.get(`/api/youtube/transcript/${video.id}?maxLength=10000`)
      
      console.log('📥 Transcript response:', {
        success: transcriptResponse.data.success,
        hasTranscript: !!transcriptResponse.data.transcript,
        transcriptType: typeof transcriptResponse.data.transcript,
        transcriptLength: transcriptResponse.data.transcript?.length
      })
      
      if (transcriptResponse.data.success && transcriptResponse.data.transcript) {
        const transcriptText = transcriptResponse.data.transcript
        setTranscript(transcriptText)
        
        console.log('📝 Transcript received:', transcriptText.substring(0, 100) + '...')
        
        // ✅ FIXED: Call Gemini endpoint for real transcript
        const summaryResponse = await axios.post('/api/gemini/summarize', {
          transcript: transcriptText,
          videoId: video.id,
          videoTitle: video.title
        })

        console.log('🤖 Summary response:', summaryResponse.data)

        if (summaryResponse.data.success) {
          // ✅ FIXED: Pass complete response object with video title
          onSummaryGenerated({
            ...summaryResponse.data.summary,
            videoTitle: video.title
          })
        } else {
          throw new Error(summaryResponse.data.message || 'Failed to generate summary')
        }
      } else {
        // Handle case where transcript is not available
        console.warn('⚠️ No transcript available, using demo content')
        
        const demoTranscript = `This is a demo transcript for the video "${video.title}". In a real implementation, this would contain the actual video transcript extracted from YouTube's captions. The video discusses various topics and provides valuable insights to viewers. This demo allows you to test the summarization feature even when captions are not available.`
        
        setTranscript(demoTranscript)
        
        // ✅ FIXED: Call Gemini endpoint for demo transcript with correct variable
        const summaryResponse = await axios.post('/api/gemini/summarize', {
          transcript: demoTranscript, // ✅ Fixed: was transcriptText, now demoTranscript
          videoId: video.id,
          videoTitle: video.title
        })

        if (summaryResponse.data.success) {
          // ✅ FIXED: Pass complete response object with video title
          onSummaryGenerated({
            ...summaryResponse.data.summary,
            videoTitle: video.title
          })
          setError('Note: This video had no captions available, so a demo transcript was used.')
        } else {
          throw new Error('Failed to generate summary from demo transcript')
        }
      }
    } catch (error) {
      console.error('❌ Summarization error:', error)
      
      let errorMessage = 'Failed to generate summary. '
      
      if (error.response?.status === 413) {
        errorMessage += 'The video transcript is too large. Try with a shorter video.'
      } else if (error.response?.status === 404) {
        errorMessage += 'Video transcript not found.'
      } else if (error.response?.status === 400) {
        errorMessage += error.response.data?.message || 'Invalid request data.'
      } else if (error.response?.data?.message) {
        errorMessage += error.response.data.message
      } else {
        errorMessage += error.message || 'Please try again.'
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
      setTranscriptLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available'
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Date not available'
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      })
    } catch (error) {
      console.error('Date formatting error:', error)
      return 'Date not available'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    >
      {/* Video Player */}
      <div className="relative aspect-video bg-black">
        <ReactPlayer
          url={video.url}
          width="100%"
          height="100%"
          playing={isPlaying}
          controls
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      </div>

      {/* Video Info */}
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
          {video.title}
        </h2>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <FaUser className="h-4 w-4" />
              <span>{video.channel}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FaClock className="h-4 w-4" />
              <span>{formatDate(video.publishedAt)}</span>
            </div>
          </div>
        </div>

        {video.description && (
          <p className="text-gray-700 text-sm mb-6 line-clamp-3">
            {video.description}
          </p>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}

        {/* Summarize Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSummarize}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>
                {transcriptLoading ? 'Getting transcript...' : 'Generating summary...'}
              </span>
            </>
          ) : (
            <>
              <FaRobot className="h-5 w-5" />
              <span>Summarize Video with AI</span>
            </>
          )}
        </motion.button>

        {/* Transcript Preview */}
        {transcript && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
            className="mt-4 p-4 bg-gray-50 rounded-lg"
          >
            <h4 className="font-medium text-gray-900 mb-2">Transcript Preview:</h4>
            <p className="text-sm text-gray-700 line-clamp-3">
              {typeof transcript === 'string' 
                ? transcript.substring(0, 200) + '...'
                : 'Transcript loaded but format is unexpected'
              }
            </p>
            <div className="mt-2 text-xs text-gray-500">
              Length: {transcript?.length || 0} characters
            </div>
          </motion.div>
        )}

        {/* Debug Info (remove in production) */}
        {process.env.NODE_ENV === 'development' && transcript && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
            <strong>Debug:</strong> Transcript type: {typeof transcript}, Length: {transcript?.length}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default VideoPlayer
