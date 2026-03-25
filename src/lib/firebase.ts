// Define Google OAuth Scopes and custom parameters
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
  hd: 'example.com' // Restrict to certain domain
});
// Add any additional parameters here...