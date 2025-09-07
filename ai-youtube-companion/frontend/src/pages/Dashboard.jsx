// frontend/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import SearchBar from '../components/SearchBar'
import VideoPlayer from '../components/VideoPlayer'
import SummaryCard from '../components/SummaryCard'
import QnASection from '../components/QnASection'
import Profile from '../components/Profile'

const Dashboard = () => {
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [currentSummary, setCurrentSummary] = useState(null)
  const [summaryHistory, setSummaryHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const handleVideoSelect = (video) => {
    setSelectedVideo(video)
    setCurrentSummary(null)
  }

  const handleNewSummary = (summary) => {
    setCurrentSummary(summary)
    setSummaryHistory(prev => [summary, ...prev])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Search and Video Player */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 space-y-6"
          >
            <SearchBar 
              onResults={setSearchResults}
              onVideoSelect={handleVideoSelect}
              results={searchResults}
            />
            
            {selectedVideo && (
              <VideoPlayer 
                video={selectedVideo}
                onSummaryGenerated={handleNewSummary}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}
          </motion.div>

          {/* Right Column - Summary, Q&A, and Profile */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <Profile summaryHistory={summaryHistory} />
            
            {currentSummary && (
              <SummaryCard 
                summary={currentSummary}
                isLoading={isLoading}
              />
            )}
            
            {selectedVideo && (
              <QnASection 
                videoId={selectedVideo.id}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard