//Firebase setup
const firebase = require('firebase');

const firebaseConfig = {
    apiKey: "AIzaSyAc99z4R1CXSHMAK 1414q8D14pTd_1jJYI",
    authDomain: "scobserver-5dbal.firebaseapp.com", 
    projectId: "scobserver-5dba1",
    storageBucket: "scobserver-5dba1.appspot.com",
    messagingSenderId: "745458496868",
    appId: "1:745458496868:web:75399abc2413fa54ea4211", 
    measurementId: "G-M3V8MF4332"
}

firebase.initializeApp(firebaseConfig);

//importing required packages and collections
const express = require('express')
const cors=require('cors')
const User=require('./user')
const Register=require('./register')
const Data=require('./data')
const Device=require('./device')
const Transaction=require('./transaction')
const Deviceinfo=require('./deviceinfo')
const Apistats=require('./apistats')
const { v4: uuidv4 } = require('uuid');
const session = require('express-session');
const cookieParser = require('cookie-parser');

//sessions setup
const sessionconfig={
    name:'session',
    secret:'scbmobileapp',
    resave: false,
    saveUninitialized: true,
    cookie:{
        httpOnly:true,
        //secure:true,
        expires: Date.now()+1000*60*60*24*7,
        maxAge: 1000*60*60*24*7
    }
}

//starting the app
const app=express()
app.use(express.json())
app.use(cors())
app.use(cookieParser());
app.use(session(sessionconfig));

//middleware for restricted links
const requirelogin = async (req,res,next)=>{
    if(!req.session.user){
        return res.send("you are not logged in");
    }
    next();
}

//hash function
const crypto = require('crypto');

function hashfunc(input) {
  const hash = crypto.createHash('sha256');
  hash.update(input);
  return hash.digest('hex');
}

//signup api
app.post('/signup',async(req,res)=>{
    const email = req.body.email;
    const name = req.body.name;
    const pass = req.body.password;
    const deviceFingerPrint = req.body.deviceFingerPrint;
    const userid = uuidv4();
    await User.doc(email).set({
        "email": email,
        "name": name,
        "password":pass,
        "userid":userid
    });
    const dateObj = new Date();
    const options = {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
        };
        
    const formattedDateTime = dateObj.toLocaleString('en-IN', options).replace(',', '') + '.' + ('000' + dateObj.getMilliseconds()).slice(-3);

    Device.doc(deviceFingerPrint).collection('userids').doc().set({
        "email":email,
        "userid":userid,
        "loginTime":formattedDateTime
    })
    req.session.user={email,id:'scb'}
    res.send(email);
})

//login api
app.post('/login',async(req,res)=>{
    
    const email = req.body.email;
    const pass = req.body.password;
    const deviceFingerPrint = req.body.deviceFingerPrint;

    let comparepsd = false;
    User.get().then(async(q)=>{
        q.forEach(async(user)=>{
           if(user.id===email && user.data().password === pass){
                comparepsd=true;
           }
        })
        if(!comparepsd){
            res.send("wrong id/password")
        }
        else{
            let userid="";
            await User.doc(email).get().then((user)=>{
                userid = user.data().userid;
            });// Get the current date and time
            const dateObj = new Date();
            const options = {
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              };
              
              const formattedDateTime = dateObj.toLocaleString('en-IN', options).replace(',', '') + '.' + ('000' + dateObj.getMilliseconds()).slice(-3);

            Device.doc(deviceFingerPrint).collection('userids').doc().set({
                "email":email,
                "userid":userid,
                "loginTime":formattedDateTime
            })
            req.session.user={email,id:'scb'}
            res.send(`logged in ${userid} !`);
        }
    })
})

//logout api
app.get('/logout',(req,res)=>{
    const user= req.session.user;
    console.log(`${user.email}logged out!`)
    req.session.user=null;
    res.send("logged out!!")
    //console.log(req.session.user);
})

//creating the transaction api
app.post('/transaction',requirelogin,async(req,res)=>{
    const amount = req.body.amount;
    const paynm = req.body.payeeName;
    const email = req.session.user.email;
    let userid="";
    await User.doc(email).get().then((user)=>{
        userid = user.data().userid;
    });
    const status = "Pending";
    const transactionid = uuidv4();

   await Transaction.doc(transactionid).set({
        "amount":amount,
        "payeeName":paynm,
        "userid":userid,
        "status":status,
        "transactionid" : transactionid
    });

    res.send("done");

})

//fetching the transactionlist
app.get('/transactionlist',requirelogin,async(req,res)=>{
    var transactions = [];
    var fields = {};
    Transaction.get().then(async(q)=>{
        q.forEach(async(transaction)=>{
            fields={
                "amount":transaction.data().amount,
                "payeeName":transaction.data().payeeName,
                "id":transaction.data().transactionid
            }
            transactions.push(fields)
        })
        res.json(transactions);
    })
})

//details of perticular transaction
app.get('/transactionlist/:id',requirelogin,async(req,res)=>{
    const {id} =req.params;
    const transaction = Transaction.doc(id)
    const snapshot = await transaction.get();
    res.send(snapshot.data());
})

//approving transaction
app.post('/transactionlist/:id/approve',requirelogin,async(req,res)=>{
    const {id} =req.params;
    const transaction = Transaction.doc(id);
    await transaction.update({ status: 'Approved' });
    const snapshot = await transaction.get();
    res.send(snapshot.data());
})

//rejecting transaction
app.post('/transactionlist/:id/reject',requirelogin,async(req,res)=>{
    const {id} =req.params;
    const transaction = Transaction.doc(id);
    await transaction.update({ status: 'Rejected' });
    const snapshot = await transaction.get();
    res.send(snapshot.data());
})




//*********************OBSERVABILITY SECTION**********************//




//Register App
app.post('/registerapp',async(req,res)=>{
    const appid = req.body.appid;
    const uid = req.body.uid;
    const platform = req.body.platform;
    const packageid = appid+platform;
    const appVersionNumber = req.body.appVersionNumber;

    let appregistered = false;

    Register.get().then(async(q)=>{
        q.forEach(async(registerapp)=>{
            if(registerapp.data().packageid===packageid && registerapp.data().uid===uid && registerapp.data().appVersionNumber===appVersionNumber){
                appregistered=true;
            }
        })

        const deviceFingerPrint = hashfunc(packageid+appVersionNumber+uid);

        if(!appregistered){
            await Register.doc(deviceFingerPrint).set({
                "appid":appid,
                "platform":platform,
                "packageid":packageid,
                "uid":uid,
                "appVersionNumber":appVersionNumber,
                "deviceFingerPrint" :deviceFingerPrint
            })
            res.send(`deviceFingerPrint: ${deviceFingerPrint}`)
        }
        else{
            res.send(`deviceFingerPrint: ${deviceFingerPrint}`)
        }
    })
})

//initialization
app.post('/initializeTracking',async(req,res)=>{
    const deviceFingerPrint = req.body.deviceFingerPrint;
    const ostype = req.body.ostype;
    const ram = req.body.ram;
    const storage = req.body.storage;
    const packageid = req.body.packageid;
    const batteryCap = req.body.batteryCap;
    
    var appfound = false;
    Register.get().then(async(q)=>{
        await q.forEach(async(application)=>{
           if(application.data().deviceFingerPrint===deviceFingerPrint ){
                appfound = true;
           }
        })
        if(appfound){
            await Deviceinfo.doc().set({
                "deviceFingerPrint":deviceFingerPrint,
                "ostype":ostype,
                "ram":ram,
                "storage":storage,
                "batteryCap":batteryCap,
                "packageid":packageid
            });
            res.send("app verified")
        }
        else{
            res.send("app not found");
        }
    })
})

//API statastics
app.post('/apistats',requirelogin,async(req,res)=>{
    const deviceFingerPrint = req.body.deviceFingerPrint;
    const ramUsed = req.body.ramUsed;
    const networkspeed=req.body.networkspeed;
    const reqtime=req.body.reqtime;
    const restime=req.body.restime;
    const rendertime=req.body.rendertime;
    const packageid=req.body.packageid;
    const battery=req.body.battery;
    
    const email = req.session.user.email;
    let userid="";
    await User.doc(email).get().then((user)=>{
        userid = user.data().userid;
    });

    await Apistats.doc().set({
        "ramUsed":ramUsed,
        "networkspeed":networkspeed,
        "reqtime":reqtime,
        "restime":restime,
        "rendertime":rendertime,
        "userid":userid,
        "packageid":packageid,
        "battery":battery,
        "deviceFingerPrint" :deviceFingerPrint
    });
    res.send("Dynamic Device information Added")
})

//User journey related data
app.post('/savedata',async(req,res)=>{
    const deviceFingerPrint = req.body.deviceFingerPrint;
    const data =req.body.data;
    /*
        here data is the object which conatains many key-value pairs, like:
            data={
                "btnName":"login",
                "path":"login/home/transactionlist",
                "userid":"qwerty"
            }
    */ 
    
    const prevData = await Data.doc(deviceFingerPrint).get().then(doc => doc.data()?.appData);
    if(prevData){
        await Data.doc(deviceFingerPrint).update({
            appData: [...prevData, {
                "data":data
            }]
        })
        res.send("User Journey Saved");
    }
    else{
        await Data.doc(deviceFingerPrint).set({
            appData: [{
                "data":data
            }]
        })  
        res.send("User Journey Saved")     ;         
    }          
})

app.listen(process.env.PORT || 3000,()=>{
    console.log("welcome to port 3000");
})