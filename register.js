const firebase = require('firebase');
// exporting the transaction collection
const db =firebase.firestore();
const Register= db.collection("register");
module.exports = Register;