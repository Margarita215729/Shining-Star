# Shining Star Cleaning Services

A comprehensive cleaning services website with multi-language support, admin dashboard, and portfolio management.

## Features

### Core Functionality
- ✅ **Multi-language Support** (English, Russian, Spanish)
- ✅ **Responsive Design** (Mobile-first approach)
- ✅ **Service Selection System** (Customizable cleaning services)
- ✅ **Portfolio Management** (Before/after photo galleries)
- ✅ **Admin Dashboard** (Complete management interface)
- ✅ **Contact Forms** (Customer inquiries and quotes)
- ✅ **Service Packages** (Bundled offerings with discounts)

### Services Offered
- 🧊 Refrigerator Cleaning
- 🪟 Window Cleaning  
- 🚿 Toilet/Bathroom Cleaning
- 🪞 Mirror Cleaning
- 🏠 Floor Cleaning
- 🪟 Windowsill Cleaning
- 🪴 Carpet Stain Removal
- 🎨 Wall Stain Removal
- ⚙️ Custom Service Options

### Technical Stack
- **Backend**: Node.js with Express.js
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **View Engine**: EJS templating
- **Internationalization**: i18n library
- **Data Storage**: JSON files (upgradeable to database)
- **Authentication**: Session-based with bcrypt
- **File Uploads**: Multer for portfolio images
- **Styling**: Custom CSS with responsive design
- **Security**: Helmet.js for security headers

## Installation & Setup

### Prerequisites
- Node.js 14.0.0 or higher
- npm (comes with Node.js)

### Installation Steps

1. **Clone the repository** (if not already done)
   ```bash
   git clone <repository-url>
   cd Shining-Star
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   # Development mode (with nodemon)
   npm run dev

   # Production mode
   npm start
   ```

4. **Access the application**
   - Website: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin/login

### Default Admin Credentials
- **Username**: `admin`
- **Password**: `admin123`

## Project Structure

```
Shining-Star/
├── data/                    # JSON data storage
│   ├── services.json       # Available cleaning services
│   ├── packages.json       # Service packages & offers
│   ├── portfolio.json      # Portfolio items
│   └── users.json          # Admin users
├── locales/                # Multi-language translations
│   ├── en.json             # English translations
│   ├── ru.json             # Russian translations
│   └── es.json             # Spanish translations
├── public/                 # Static assets
│   ├── css/                # Stylesheets
│   ├── js/                 # Client-side JavaScript
│   ├── images/             # Images
│   └── uploads/            # Uploaded portfolio images
├── routes/                 # Express.js routes
│   ├── index.js            # Main website routes
│   ├── admin.js            # Admin panel routes
│   └── api.js              # API endpoints
├── views/                  # EJS templates
│   ├── pages/              # Main pages
│   │   ├── admin/          # Admin panel pages
│   │   ├── home.ejs
│   │   ├── services.ejs
│   │   ├── portfolio.ejs
│   │   ├── contact.ejs
│   │   └── 404.ejs
│   └── partials/           # Reusable components
│       ├── header.ejs
│       └── footer.ejs
├── server.js               # Main application server
├── package.json            # Dependencies & scripts
└── README.md              # This file
```

## Usage Guide

### For Customers

1. **Browse Services**: Visit the main website to see available cleaning services
2. **Select Services**: Use the interactive service selection on the Services page
3. **Get Quote**: Choose individual services or packages to get an instant quote
4. **Contact**: Submit inquiries through the contact form
5. **Multi-language**: Switch between English, Russian, and Spanish

### For Administrators

1. **Login**: Access `/admin/login` with admin credentials
2. **Dashboard**: View business statistics and quick actions
3. **Portfolio Management**: Upload before/after photos of completed work
4. **Services Management**: Edit service details and pricing (basic framework)
5. **Packages Management**: Create and manage service bundles (basic framework)

## Configuration

### Language Support
The application supports three languages out of the box:
- English (en) - Default
- Russian (ru)
- Spanish (es)

To add more languages:
1. Create a new JSON file in the `locales/` directory
2. Update the `i18n.configure()` locales array in `server.js`
3. Add the language option to the language selector in `header.ejs`

### Services Configuration
Edit `data/services.json` to modify:
- Service names and descriptions (in all languages)
- Pricing and duration
- Service categories
- Availability status

### Package Configuration
Edit `data/packages.json` to modify:
- Package offerings
- Discount percentages
- Included services
- Package availability

## Development

### Scripts
- `npm start` - Start the production server
- `npm run dev` - Start development server with nodemon (auto-restart)

### Adding New Features

**New Routes**: Add to the appropriate file in the `routes/` directory
**New Pages**: Create EJS templates in `views/pages/`
**Styling**: Add CSS to `public/css/main.css` or `public/css/responsive.css`
**Translations**: Update all language files in `locales/`

### Security Considerations

- Default admin password should be changed in production
- Session secret should be environment-specific
- File upload validation is implemented
- HTTPS should be used in production
- Regular security updates recommended

## Deployment

### Environment Variables (Production)
```bash
PORT=3000                                    # Server port
NODE_ENV=production                          # Environment
SESSION_SECRET=your-secret-key-here         # Session encryption key
```

### Production Checklist
- [ ] Change default admin password
- [ ] Set strong session secret
- [ ] Enable HTTPS
- [ ] Configure proper error logging
- [ ] Set up database (if upgrading from JSON)
- [ ] Configure backup strategy for uploads
- [ ] Set up monitoring and analytics

## Browser Support
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

## License
MIT License - See LICENSE file for details

## Support
For technical support or feature requests, please create an issue in the repository.

---

**🌟 Shining Star Cleaning Services** - Making your space shine like never before!
