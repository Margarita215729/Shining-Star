const mongoose = require('mongoose');

// MongoDB connection string from the problem statement
const MONGODB_URI = "mongodb+srv://makeeva01m:5NZTbFE5XBVdSFRa@cluster-for-shining-sta.owyjtje.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-For-Shining-Star";

// Service Schema
const serviceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: {
    en: { type: String, required: true },
    ru: { type: String, default: '' },
    es: { type: String, default: '' }
  },
  description: {
    en: { type: String, required: true },
    ru: { type: String, default: '' },
    es: { type: String, default: '' }
  },
  price: { type: Number, required: true },
  duration: { type: Number, required: true },
  category: { type: String, required: true },
  available: { type: Boolean, default: true },
  calculationType: { type: String, enum: ['quantity', 'area', 'time', 'fixed'], default: 'fixed' },
  unit: { type: String, default: null },
  maxQuantity: { type: Number, default: null },
  minArea: { type: Number, default: null },
  maxArea: { type: Number, default: null }
}, { timestamps: true });

// Package Schema
const packageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: {
    en: { type: String, required: true },
    ru: { type: String, default: '' },
    es: { type: String, default: '' }
  },
  description: {
    en: { type: String, required: true },
    ru: { type: String, default: '' },
    es: { type: String, default: '' }
  },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  services: [{ type: String }],
  duration: { type: Number, required: true },
  available: { type: Boolean, default: true }
}, { timestamps: true });

// Portfolio Schema
const portfolioSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: {
    en: { type: String, required: true },
    ru: { type: String, default: '' },
    es: { type: String, default: '' }
  },
  description: {
    en: { type: String, required: true },
    ru: { type: String, default: '' },
    es: { type: String, default: '' }
  },
  images: [{ type: String }],
  category: { type: String, required: true },
  date: { type: Date, default: Date.now },
  featured: { type: Boolean, default: false }
}, { timestamps: true });

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  name: { type: String, required: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

// Models
const Service = mongoose.model('Service', serviceSchema);
const Package = mongoose.model('Package', packageSchema);
const Portfolio = mongoose.model('Portfolio', portfolioSchema);
const User = mongoose.model('User', userSchema);

// Connection function
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    return false;
  }
}

// Migration functions to move data from JSON to MongoDB
async function migrateJSONToMongo() {
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    // Migrate services
    const servicesData = JSON.parse(await fs.readFile(path.join(__dirname, '../data/services.json'), 'utf8'));
    for (const service of servicesData) {
      await Service.findOneAndUpdate(
        { id: service.id },
        service,
        { upsert: true, new: true }
      );
    }
    console.log('✅ Services migrated to MongoDB');

    // Migrate packages
    const packagesData = JSON.parse(await fs.readFile(path.join(__dirname, '../data/packages.json'), 'utf8'));
    for (const pkg of packagesData) {
      await Package.findOneAndUpdate(
        { id: pkg.id },
        pkg,
        { upsert: true, new: true }
      );
    }
    console.log('✅ Packages migrated to MongoDB');

    // Migrate portfolio
    const portfolioData = JSON.parse(await fs.readFile(path.join(__dirname, '../data/portfolio.json'), 'utf8'));
    for (const item of portfolioData) {
      await Portfolio.findOneAndUpdate(
        { id: item.id },
        item,
        { upsert: true, new: true }
      );
    }
    console.log('✅ Portfolio migrated to MongoDB');

    // Migrate users
    const usersData = JSON.parse(await fs.readFile(path.join(__dirname, '../data/users.json'), 'utf8'));
    for (const user of usersData) {
      await User.findOneAndUpdate(
        { username: user.username },
        user,
        { upsert: true, new: true }
      );
    }
    console.log('✅ Users migrated to MongoDB');

  } catch (error) {
    console.error('Migration error:', error);
  }
}

module.exports = {
  connectDB,
  migrateJSONToMongo,
  Service,
  Package,
  Portfolio,
  User
};