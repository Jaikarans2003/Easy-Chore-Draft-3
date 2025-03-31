const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
require('dotenv').config();

// Firebase admin setup (server-side)
let adminInitialized = false;
try {
  // Initialize Firebase Admin SDK with service account
  // The private key must be properly formatted in the .env file
  // with newlines represented as "\n"
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  };
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });
  
  adminInitialized = true;
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
  if (process.env.NODE_ENV !== 'development') {
    process.exit(1); // Only exit in production
  } else {
    console.log('DEVELOPMENT MODE: Continuing despite Firebase Admin initialization failure');
  }
}

// Firebase client setup (browser-side)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

let app, auth;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  console.log('Firebase configuration completed successfully');
} catch (error) {
  console.error('Firebase client initialization error:', error);
  if (process.env.NODE_ENV !== 'development') {
    process.exit(1);
  } else {
    console.log('DEVELOPMENT MODE: Continuing despite Firebase client initialization failure');
  }
}

module.exports = { admin, auth, adminInitialized };