const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const i18n = require('i18n');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

// Fix for Vercel deployment - Updated config
const publicPath = path.resolve(__dirname, 'public');
const viewsPath = path.resolve(__dirname, 'views');
const localesPath = path.resolve(__dirname, 'locales');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"]
    }
  }
}));

// Logging middleware
app.use(morgan('combined'));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use(express.static(publicPath));

// Session configuration
app.use(session({
  secret: 'shining-star-cleaning-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// i18n configuration
i18n.configure({
  locales: ['en', 'ru', 'es'],
  directory: localesPath,
  defaultLocale: 'en',
  cookie: 'lang',
  queryParameter: 'lang',
  autoReload: true,
  updateFiles: false,
  objectNotation: true,
  api: {
    '__': '__',
    '__n': '__n'
  }
});

app.use(i18n.init);

// Set view engine
app.set('view engine', 'ejs');
app.set('views', viewsPath);
app.use(expressLayouts);
app.set('layout', 'layout');

// Make i18n available in templates
app.use((req, res, next) => {
  res.locals.__ = req.__;
  res.locals.__n = req.__n;
  res.locals.locale = req.getLocale();
  res.locals.user = req.session.user || null;
  next();
});

// Routes
app.use('/', require('./routes/index'));
app.use('/admin', require('./routes/admin'));
app.use('/api', require('./routes/api'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('pages/404', {
    title: res.__('Page Not Found'),
    currentPage: '404'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🌟 Shining Star Cleaning Services server running on port ${PORT}`);
    console.log(`🔗 Access the website at: http://localhost:${PORT}`);
  });
}

module.exports = app;