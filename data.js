const firebase = require('firebase');
// expoting user collection
const db =firebase.firestore();
const Data= db.collection("data");
module.exports = Data;