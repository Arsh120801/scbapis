const firebase = require('firebase');
// exporting the transaction collection
const db =firebase.firestore();
const Deviceinfo= db.collection("deviceinfo");
module.exports = Deviceinfo;