const express = require("express");
const router = express.Router();
const { getTranscript } = require("../utils/youtubeTranscript");
const axios = require("axios");

// Search YouTube videos
router.get("/search", async (req, res) => {
  try {
    const { q, maxResults = 15 } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: "Search query is required" });
    }

    const response = await axios.get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        part: "snippet",
        q,
        type: "video",
        maxResults,
        key: process.env.YOUTUBE_API_KEY,
      },
    });

    const videos = response.data.items.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      channel: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));

    res.json({ success: true, videos });
  } catch (error) {
    console.error("YouTube search error:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Failed to search videos" });
  }
});

// Get transcript
router.get("/transcript/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;
    const { maxLength, format = 'both' } = req.query;
    
    console.log("📥 Transcript request for:", videoId);
    
    const result = await getTranscript(videoId);
    
    if (!result || (!result.plainText && !result.structured)) {
      return res.status(404).json({ 
        success: false, 
        message: "No transcript available for this video",
        videoId 
      });
    }
    
    let transcriptText = result.plainText || '';
    let structuredData = result.structured || [];
    
    if (maxLength) {
      const limit = parseInt(maxLength);
      if (transcriptText.length > limit) {
        transcriptText = transcriptText.substring(0, limit) + '... [truncated]';
      }
    }
    
    const response = {
      success: true,
      videoId,
      transcript: transcriptText,
      length: result.plainText?.length || 0,
      trackInfo: result.trackInfo || {}
    };
    
    if (format === 'both' && structuredData.length > 0) {
      response.structured = structuredData;
    }
    
    res.json(response);
    
  } catch (error) {
    console.error("Error in /transcript route:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch transcript", 
      error: error.message,
      videoId: req.params.videoId 
    });
  }
});

module.exports = router;
