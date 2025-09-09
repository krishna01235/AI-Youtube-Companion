// backend/index.js
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();
console.log('GOOGLE_API_KEY:', process.env.GEMINI_API_KEY);

const app = express();
app.set('trust proxy', 1); // moved after app creation

const PORT = process.env.PORT || 5000;

const authRoutes = require('./routes/auth');
const youtubeRoutes = require('./routes/youtube');
const geminiRoutes = require('./routes/gemini');

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true in production
    sameSite: 'none',                              // allow cross-site
    httpOnly: true                                 // prevent JS access
  }
}));

app.use(passport.initialize());
app.use(passport.session());

const FRONTEND_URL = process.env.FRONTEND_URL; // e.g., https://ai-youtube-companion.vercel.app
const BACKEND_URL = process.env.BACKEND_URL;   // e.g., https://ai-youtube-companion.onrender.com

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${BACKEND_URL}/auth/google/callback`,
}, async (accessToken, refreshToken, profile, done) => {
  const user = {
    id: profile.id,
    name: profile.displayName,
    email: profile.emails[0].value,
    avatar: profile.photos[0].value,
    accessToken
  };
  return done(null, user);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

const requireAuth = (req, res, next) => {
  console.log('Auth check - User:', req.user ? 'Authenticated' : 'Not authenticated');
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  next();
};

// Public routes
app.use('/auth', authRoutes);

// Protected routes
app.use('/api/youtube', require('./routes/youtube'));
app.use('/api/gemini', require('./routes/gemini'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'AI YouTube Companion API is running!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
console.log("Client ID:", process.env.GOOGLE_CLIENT_ID);

module.exports = app;
