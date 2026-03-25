import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Google OAuth Configuration
const provider = new firebase.auth.GoogleAuthProvider();
provider.addScope('profile');
provider.addScope('email');
provider.setCustomParameters({ prompt: 'consent' });

export const auth = firebase.auth();
export const firestore = firebase.firestore();

// Enum for Operation Types
export enum OperationType {
  Create = 'CREATE',
  Read = 'READ',
  Update = 'UPDATE',
  Delete = 'DELETE',
}

// Interface for Firestore Error Info
export interface FirestoreErrorInfo {
  message: string;
  code: string;
}

// Function to handle Firestore errors
export function handleFirestoreError(error: FirestoreErrorInfo) {
  console.error(`Error ${error.code}: ${error.message}`);
}

// Function to test Firestore connection
export async function testConnection() {
  try {
    await firestore.doc('/test/testDoc').get();
    console.log('Firestore connection successful!');
  } catch (error) {
    handleFirestoreError(error);
  }
}