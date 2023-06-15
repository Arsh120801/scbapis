const firebase = require('firebase');
// expoting user collection
const db =firebase.firestore();
const Device= db.collection("devices");
module.exports = Device;