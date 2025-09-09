let fetch;
let parseStringPromise;
const { Innertube } = require("youtubei.js");

// Initialize dependencies
async function initializeDependencies() {
  if (!fetch) {
    if (typeof globalThis !== 'undefined' && globalThis.fetch) {
      fetch = globalThis.fetch;
    } else {
      const nodeFetch = require("node-fetch");
      fetch = nodeFetch.default || nodeFetch;
    }
  }

  if (!parseStringPromise) {
    const xml2js = require("xml2js");
    parseStringPromise = xml2js.parseStringPromise;
  }
}

/**
 * Method 1: Enhanced scraping with multiple client types
 */
async function getTranscriptScraping(videoUrlOrId, language = "en") {
  await initializeDependencies();

  const videoId = extractVideoId(videoUrlOrId);
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const response = await fetch(videoUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: Video may be unavailable`);
  }
  
  const html = await response.text();
  
  // Multiple API key extraction patterns
  const apiKeyPatterns = [
    /"INNERTUBE_API_KEY":"([^"]+)"/,
    /"innertubeApiKey":"([^"]+)"/,
    /INNERTUBE_API_KEY.*?"([^"]+)"/,
    /"apiKey":"([^"]+)"/
  ];

  let apiKey = null;
  for (const pattern of apiKeyPatterns) {
    const match = html.match(pattern);
    if (match) {
      apiKey = match[1];
      break;
    }
  }

  if (!apiKey) {
    throw new Error("Could not extract API key from page");
  }

  // Try multiple client configurations
  const clientConfigs = [
    // Web client (most common)
    {
      clientName: "WEB",
      clientVersion: "2.20231201.01.00"
    },
    // Android client (original)
    {
      clientName: "ANDROID",
      clientVersion: "20.10.38",
      androidSdkVersion: 33,
      osName: "Android",
      osVersion: "13"
    },
    // TV HTML5 client (sometimes has different caption access)
    {
      clientName: "TVHTML5_SIMPLY_EMBEDDED_PLAYER",
      clientVersion: "2.0"
    },
    // iOS client
    {
      clientName: "IOS",
      clientVersion: "18.43.4",
      deviceMake: "Apple",
      deviceModel: "iPhone12,1"
    },
    // Web embedded player
    {
      clientName: "WEB_EMBEDDED_PLAYER",
      clientVersion: "1.20231201.01.00"
    }
  ];

  let lastError = null;
  
  for (const clientConfig of clientConfigs) {
    try {
      console.log(`🔄 Trying client: ${clientConfig.clientName}`);
      
      const playerResponse = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${apiKey}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "User-Agent": clientConfig.clientName === "WEB" 
            ? "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            : "com.google.android.youtube/20.10.38 (Linux; U; Android 13) gzip"
        },
        body: JSON.stringify({
          context: { 
            client: clientConfig,
            // Add request context that might help
            request: {
              useSsl: true
            }
          },
          videoId,
          // Add these parameters that sometimes help with caption access
          params: "8AEB", // Common parameter for caption requests
          captionTrackLanguage: language
        })
      });

      if (!playerResponse.ok) {
        console.warn(`❌ ${clientConfig.clientName} failed with HTTP ${playerResponse.status}`);
        continue;
      }

      const playerData = await playerResponse.json();
      
      // Check multiple possible locations for captions
      let tracks = null;
      
      // Location 1: Standard location
      if (playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks) {
        tracks = playerData.captions.playerCaptionsTracklistRenderer.captionTracks;
        console.log(`✅ Found captions in standard location (${clientConfig.clientName})`);
      }
      
      // Location 2: Alternative location
      else if (playerData?.captions?.playerCaptionsRenderer?.captionTracks) {
        tracks = playerData.captions.playerCaptionsRenderer.captionTracks;
        console.log(`✅ Found captions in alternative location (${clientConfig.clientName})`);
      }
      
      // Location 3: Direct captions array
      else if (playerData?.captions?.captionTracks) {
        tracks = playerData.captions.captionTracks;
        console.log(`✅ Found captions in direct location (${clientConfig.clientName})`);
      }

      if (tracks && tracks.length > 0) {
        console.log(`📝 Available tracks:`, tracks.map(t => ({
          lang: t.languageCode,
          name: t.name?.simpleText || t.name,
          kind: t.kind
        })));
        
        // Find the best track
        let track = tracks.find(t => t.languageCode === language);
        if (!track) {
          track = tracks.find(t => t.languageCode?.startsWith(language));
        }
        if (!track) {
          track = tracks[0];
        }

        // Extract the transcript
        const baseUrl = track.baseUrl.replace(/&fmt=\w+$/, "");
        const xmlResponse = await fetch(baseUrl);
        
        if (!xmlResponse.ok) {
          console.warn(`❌ Caption XML fetch failed for ${clientConfig.clientName}`);
          continue;
        }
        
        const xml = await xmlResponse.text();
        const parsed = await parseStringPromise(xml);

        if (!parsed?.transcript?.text) {
          console.warn(`❌ Invalid XML format for ${clientConfig.clientName}`);
          continue;
        }

        const structuredTranscript = parsed.transcript.text
          .map(entry => ({
            text: entry._ || "",
            start: parseFloat(entry.$.start || 0),
            duration: parseFloat(entry.$.dur || 0),
          }))
          .filter(entry => entry.text.trim().length > 0);

        const plainText = structuredTranscript
          .map(entry => entry.text)
          .join(" ")
          .replace(/\[.*?\]/g, "")
          .replace(/\s+/g, " ")
          .trim();

        console.log(`✅ Successfully extracted transcript using ${clientConfig.clientName}`);
        
        return {
          structured: structuredTranscript,
          plainText,
          trackInfo: {
            name: track.name?.simpleText || track.name,
            language: track.languageCode,
            isAutoGenerated: track.kind === "asr",
            extractedWith: clientConfig.clientName
          }
        };
      }
      
      console.warn(`⚠️ No captions found with ${clientConfig.clientName}`);
      
    } catch (error) {
      console.warn(`❌ ${clientConfig.clientName} failed:`, error.message);
      lastError = error;
      continue;
    }
  }

  throw new Error(`All client configurations failed. Last error: ${lastError?.message}`);
}

/**
 * Method 2: Enhanced youtubei.js with multiple configurations
 */
async function getTranscriptWithYTJS(videoUrlOrId, language = "en") {
  const videoId = extractVideoId(videoUrlOrId);
  
  // Try different Innertube configurations
  const configs = [
    { visitor_data: undefined }, // Default
    { visitor_data: null },      // Explicit null
    { enable_session: false },   // Disable session
  ];

  let lastError = null;
  
  for (const config of configs) {
    try {
      console.log(`🔄 Trying youtubei.js config:`, Object.keys(config));
      
      const yt = await Innertube.create(config);
      const info = await yt.getInfo(videoId);

      // Check multiple possible caption locations
      let captionTracks = null;
      
      if (info.captions?.caption_tracks?.length) {
        captionTracks = info.captions.caption_tracks;
      } else if (info.player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks?.length) {
        captionTracks = info.player_response.captions.playerCaptionsTracklistRenderer.captionTracks;
      }

      if (!captionTracks?.length) {
        console.warn(`⚠️ No captions found with config:`, Object.keys(config));
        continue;
      }

      console.log(`✅ Found ${captionTracks.length} caption tracks`);

      // Find the best track
      let track = captionTracks.find(t => t.language_code === language);
      if (!track) {
        track = captionTracks.find(t => t.language_code?.startsWith(language));
      }
      if (!track) {
        track = captionTracks[0];
      }

      const transcript = await track.download();
      
      if (!transcript || transcript.length === 0) {
        console.warn(`⚠️ Empty transcript with config:`, Object.keys(config));
        continue;
      }

      const structuredTranscript = transcript.map(entry => ({
        text: entry.text || "",
        start: entry.start || 0,
        duration: entry.duration || 0,
      }));

      const plainText = structuredTranscript
        .map(e => e.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      console.log(`✅ Successfully extracted transcript using youtubei.js`);

      return {
        structured: structuredTranscript,
        plainText,
        trackInfo: {
          name: track.name,
          language: track.language_code,
          isAutoGenerated: track.kind === "asr",
          extractedWith: "youtubei.js"
        }
      };
      
    } catch (error) {
      console.warn(`❌ youtubei.js config failed:`, error.message);
      lastError = error;
      continue;
    }
  }

  throw new Error(`All youtubei.js configurations failed. Last error: ${lastError?.message}`);
}

/**
 * Method 3: Direct caption URL extraction (last resort)
 */
async function getTranscriptDirectExtraction(videoUrlOrId, language = "en") {
  const videoId = extractVideoId(videoUrlOrId);
  
  // Sometimes captions are embedded differently in the HTML
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  const response = await fetch(videoUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  
  const html = await response.text();
  
  // Look for direct caption URLs in the HTML
  const captionUrlPatterns = [
    /https:\/\/www\.youtube\.com\/api\/timedtext[^"]+/g,
    /"captionTracks":\[([^\]]+)\]/,
    /"baseUrl":"(https:[^"]+timedtext[^"]+)"/g
  ];
  
  let captionUrls = [];
  
  for (const pattern of captionUrlPatterns) {
    const matches = html.match(pattern);
    if (matches) {
      captionUrls.push(...matches);
    }
  }
  
  if (captionUrls.length === 0) {
    throw new Error("No direct caption URLs found in HTML");
  }
  
  console.log(`🔍 Found ${captionUrls.length} potential caption URLs`);
  
  // Try each URL
  for (const url of captionUrls) {
    try {
      const cleanUrl = url.replace(/\\u0026/g, '&').replace(/\\/g, '');
      console.log(`🔄 Trying direct URL: ${cleanUrl.substring(0, 100)}...`);
      
      const captionResponse = await fetch(cleanUrl);
      
      if (!captionResponse.ok) continue;
      
      const xml = await captionResponse.text();
      const parsed = await parseStringPromise(xml);
      
      if (parsed?.transcript?.text) {
        console.log(`✅ Successfully extracted via direct URL method`);
        
        const structuredTranscript = parsed.transcript.text
          .map(entry => ({
            text: entry._ || "",
            start: parseFloat(entry.$.start || 0),
            duration: parseFloat(entry.$.dur || 0),
          }))
          .filter(entry => entry.text.trim().length > 0);

        const plainText = structuredTranscript
          .map(entry => entry.text)
          .join(" ")
          .replace(/\[.*?\]/g, "")
          .replace(/\s+/g, " ")
          .trim();

        return {
          structured: structuredTranscript,
          plainText,
          trackInfo: {
            name: "Direct extraction",
            language: language,
            isAutoGenerated: true,
            extractedWith: "direct-url"
          }
        };
      }
    } catch (error) {
      console.warn(`⚠️ Direct URL failed:`, error.message);
      continue;
    }
  }
  
  throw new Error("All direct caption URLs failed");
}

/**
 * Main transcript extraction with all methods
 */
async function getTranscript(videoUrlOrId, language = "en") {
  const videoId = extractVideoId(videoUrlOrId);
  console.log(`\n🎯 EXTRACTING TRANSCRIPT FOR: ${videoId}`);
  console.log(`Language: ${language}`);
  console.log(`=`.repeat(50));
  
  const methods = [
    { name: "Enhanced Scraping", func: getTranscriptScraping },
    { name: "Enhanced youtubei.js", func: getTranscriptWithYTJS },
    { name: "Direct URL Extraction", func: getTranscriptDirectExtraction }
  ];
  
  let lastError = null;
  
  for (const method of methods) {
    try {
      console.log(`\n🚀 METHOD: ${method.name}`);
      console.log(`-`.repeat(30));
      
      const result = await method.func(videoUrlOrId, language);
      
      console.log(`✅ SUCCESS with ${method.name}!`);
      console.log(`Extracted ${result.structured.length} transcript entries`);
      console.log(`Plain text length: ${result.plainText.length} characters`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ ${method.name} failed: ${error.message}`);
      lastError = error;
    }
  }
  
  console.log(`\n💥 ALL METHODS FAILED FOR ${videoId}`);
  console.log(`=`.repeat(50));
  
  throw new Error(`All transcript extraction methods failed for video ${videoId}. ` +
    `Even though captions exist on YouTube, the API extraction is not working. ` +
    `This might be due to YouTube's anti-bot measures or API changes. ` +
    `Last error: ${lastError?.message}`);
}

/**
 * Extract video ID from YouTube URL
 */
function extractVideoId(videoUrlOrId) {
  if (/^[a-zA-Z0-9_-]{11}$/.test(videoUrlOrId)) {
    return videoUrlOrId;
  }
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = videoUrlOrId.match(pattern);
    if (match) return match[1];
  }
  
  return videoUrlOrId;
}

module.exports = { 
  getTranscript,
  extractVideoId 
};