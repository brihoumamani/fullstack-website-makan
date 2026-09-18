// makan-backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
      type: String,
      enum: ['user', 'agent', 'admin'],
      default: 'user'
    },
    membershipType: {
      type: String,
      enum: ['individual', 'corporate'],
      default: 'individual'
    },
    companyName: {
      type: String,
      trim: true,
      default: ''
    },
    taxNumber: {
      type: String,
      trim: true,
      default: ''
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
    },
    // Dual-Mode Dashboard & Advertiser fields
    hasAdvertiserProfile: {
      type: Boolean,
      default: false
    },
    activeDashboardMode: {
      type: String,
      enum: ['client', 'advertiser'],
      default: 'client'
    },
    advertiserProfile: {
      agencyName: { type: String, default: '' },
      phone: { type: String, default: '' },
      wilaya: { type: String, default: '' },
      commune: { type: String, default: '' },
      licenseNumber: { type: String, default: '' },
      bio: { type: String, default: '' }
    },
    // Location & Contact Preferences
    wilaya: { type: String, default: '' },
    commune: { type: String, default: '' },
    address: { type: String, default: '' },
    emailConsent: { type: Boolean, default: false },
    smsConsent: { type: Boolean, default: false },
    // Saved Favorites
    favorites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property'
    }]
  },
  {
    timestamps: true
  }
);

// Pre-save hook: Hash password with bcrypt before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method: Compare entered password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
