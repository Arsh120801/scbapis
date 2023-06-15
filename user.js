const firebase = require('firebase');
// expoting user collection
const db =firebase.firestore();
const User= db.collection("users");
module.exports = User;