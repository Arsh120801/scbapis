const firebase = require('firebase');
// exporting the transaction collection
const db =firebase.firestore();
const Transaction= db.collection("transactions");
module.exports = Transaction;