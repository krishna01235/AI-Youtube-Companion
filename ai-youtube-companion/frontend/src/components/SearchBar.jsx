// frontend/src/components/SearchBar.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaSearch, FaPlay, FaClock } from 'react-icons/fa'
import axios from 'axios'

const SearchBar = ({ onResults, onVideoSelect, results }) => {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    try {
      const res = await axios.get(
        `https://ai-youtube-companion.vercel.app/api/youtube/search?q=${encodeURIComponent(query)}`,
        { withCredentials: true } // ✅ send session cookie for protected routes
      )

      if (res.data.success) {
        onResults(res.data.videos)
      }
    } catch (error) {
      console.error('Search error:', error)
      onResults([]) // clear previous results on error
    } finally {
      setIsSearching(false)
    }
  }

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString()

  const truncateText = (text, maxLength) =>
    text.length <= maxLength ? text : text.substring(0, maxLength) + '...'

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search YouTube videos..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
          />
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={isSearching}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
          >
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Search'
            )}
          </motion.button>
        </div>
      </form>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 max-h-96 overflow-y-auto"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Search Results ({results.length})
            </h3>
            {results.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => onVideoSelect(video)}
                className="flex space-x-4 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200 border border-gray-100"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-32 h-20 rounded-lg object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                    <FaPlay className="text-white h-6 w-6" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                    {truncateText(video.title, 80)}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">{video.channel}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <FaClock className="h-3 w-3" />
                      <span>{formatDate(video.publishedAt)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SearchBar
