const express = require('express');
const { generateSummary, answerQuestion } = require('../utils/geminiClient');
const router = express.Router();

router.post('/summarize', async (req, res) => {
  try {
    const { transcript, videoId, videoTitle } = req.body;
    
    if (!transcript) {
      return res.status(400).json({
        success: false,
        message: 'Transcript is required'
      });
    }

    const summary = await generateSummary(transcript);
    
    const summaryData = {
      id: Date.now().toString(),
      videoId,
      videoTitle,
      summary,
      timestamp: new Date().toISOString(),
    };

    res.json({
      success: true,
      summary: summaryData
    });
  } catch (error) {
    console.error('Summary generation error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate summary'
    });
  }
});

router.post('/question', async (req, res) => {
  try {
    const { transcript, question } = req.body;
    
    if (!transcript || !question) {
      return res.status(400).json({
        success: false,
        message: 'Transcript and question are required'
      });
    }

    const answer = await answerQuestion(transcript, question);
    
    res.json({
      success: true,
      answer: {
        question,
        answer,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Question answering error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to answer question'
    });
  }
});

module.exports = router;
