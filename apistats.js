const firebase = require('firebase');
// exporting the transaction collection
const db =firebase.firestore();
const Apistats= db.collection("apistats");
module.exports = Apistats;