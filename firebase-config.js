// firebase-config.js — paste your Firebase web config here to enable cloud sync.
// Leave it empty (as shipped) and the app runs entirely on-device with no sign-in.
// This config is PUBLIC by design (Firebase web keys are not secrets); your data is
// protected by the Firestore security rules in firestore.rules, not by hiding this.
//
// To enable sync:
//   1. Create a Firebase project at https://console.firebase.google.com
//   2. Add a Web app, copy its config object, and paste the values below
//   3. Enable Authentication → Email/Password
//   4. Create a Firestore database, and publish the rules from firestore.rules
//
// Example shape:
// export const firebaseConfig = {
//   apiKey: 'AIza...', authDomain: 'x.firebaseapp.com', projectId: 'x',
//   storageBucket: 'x.appspot.com', messagingSenderId: '123', appId: '1:123:web:abc',
// };

export const firebaseConfig = {};
