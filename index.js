
const express = require("express");
const app = express();
const bodyParser = require('body-parser');  
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const path = require("path");
app.set('view engine', 'ejs');  

const PORT = process.env.PORT || 3000 ;

app.use(express.static(__dirname + '/public/images'));


//const connection = require('model');
const mongoose = require('mongoose');



  const PDFDocument = require('pdfkit');
  const fs = require('fs');
  const doc = new PDFDocument;




// database url
const url = 'mongodb+srv://mtuattendance:MTUattendance@cluster0.qqv65.mongodb.net/?retryWrites=true&w=majority';
 // connect database to application 
mongoose.connect(url,{
 useNewUrlParser: true,
 useUnifiedTopology: true}
).then(console.log("Mongo DB connected"))
.catch(err => console.log(err));



const member = new mongoose.Schema({
  full_name:{
    type:String   
  },
  matric_no:{
    type:String
  },
  level:{
    type:String
  },
  group_no:{
    type:String
  },
  seat_no:{
    type:String
  },
  department:{
    type:String
  },
  sdc:{
    type:Number,
    default: 0
  },
  warning_letter:Array
})

const Admin = new mongoose.Schema({ 
user_name :{
  type:String,
  default:"mtuadmin"
  
},
password:{
  type:String,
  default:"<mtu>pa$$word"
},
annouce:{
  type:String,
  default:"! No Message"
}

  })

const pass = mongoose.model('pass',Admin);

const Student = mongoose.model('Student',member);


app.use(function start (req,res,next){


  pass.find((err,res)=>{
    if(err){
      console.log("error")
}
else{
  if(!(res.user_name == "mtuadmin") && (res.length < 1)){

   var newadmin = new pass({ })

newadmin.save((err,pass)=>{
  if(err){
    console.log('unsucessful');
  }else{
    console.log('Created');  
  }
}
)
  }else{
        next();
  }
} 
 

})
}
)



app.get('/',(req,res)=>{
  res.render("project/home")
})

app.get('/login',(req,res)=>{

  res.render("project/login")
})



app.post('/print', (req,res)=>{

var anything = "" + Math.floor(Math.random()*100000000);

  var unit = req.body;
  var name = unit.a;
  var matric = unit.b;
  var dep = unit.c;
  var lev = unit.d;
  var day = unit.date; 

  doc.pipe(fs.createWriteStream('warning_letter')); // write to PDF
  doc.pipe(res);                                       // HTTP response
  doc.text('Warning Letter ', 250, 100)
doc.text(`MTU chapel :`, 100, 100)
doc.text(`I ${name} on the ${day} failed to appear in the chapel ,` , 100, 150)
doc.text(`
  Matriculation Number ${matric} , department ${dep} , a ${lev} student .

   Is there by warned By the school management .

  Not to break rules and regulation of the prestigous university ,

  Mountain Top University , in refusal to come to the school chapel.  `)

  // add stuff to PDF here using methods described below...

  // finalize the PDF and end the stream
  doc.end();

})



app.post('/chapel_member',(req,res)=>{

var data = req.body;

var finder = pass.findOne();

  finder.exec(function (err,out){
   if(err) throw err;
 if((out.user_name == data.loginuser ) && (out.password == data.loginpass )){
  res.render("project/chapel_home");
}else{
  res.render("project/login");
}
})

  
})

app.get('/announcement',(req,res)=>{
  var finder = pass.findOne();

  finder.exec(function (err,out){
   if(err) throw err;
  res.render("project/annoucement",{output : out});

})

})

app.post('/makeannoucement',(req,res)=>{

  var finder = pass.findOne();

  finder.exec(function (err,out){
   if(err) throw err;
res.render('project/make_annoucement',{output : out});

})


})

app.post('/postmessage',(req,res)=>{

var input = req.body.message;

var found = pass.findOne();


  var finder = pass.updateOne({user_name : "admin"},{annouce : input });

  finder.exec(function (err,out){
   if(err) throw err;


found.exec(function (err,out){
   if(err) throw err;
res.render('project/make_annoucement',{output : out});

})
})




})



app.post('/clear_list',(req,res)=>{
  Student.update({$gt:{sdc :1}},{sdc :0},(err,res)=>{
    if(err){
console.log(err);
    }else{
console.log('cleared');
    }
  })
   res.render("project/chapel_home");
})

// attendance marking
app.post('/mark',(req,res)=>{
  res.render("project/mark", { result: "" , me : "group number"})
})

// take checkboxes
app.post('/startmark',(req,res)=>{

var match = [];
match.push(req.body.clicks);


 let time = new Date();

// current date
// adjust 0 before single digit date
let date = ("0" + time.getDate()).slice(-2);

// current month
let month = ("0" + (time.getMonth() + 1)).slice(-2);

// current year
let year = time.getFullYear();

// current hours
let hours = time.getHours();

// current minutes
let minutes = time.getMinutes();

// current seconds
let seconds = time.getSeconds();


// prints date & time in YYYY-MM-DD HH:MM
let print = year + "-" + month + "-" + date + " " + hours + ":" + minutes ;


try{
for (var i = 0; i < match.length; i++) {
      

  Student.update({matric_no: match[i]},
    {$push :{warning_letter:{
    day: print
  }}}
,(err,res)=>{
    if(err) {
         console.log('cancel');
   }else{
console.log('added');
  }})


 Student.update({matric_no: match[i] },{$inc : { sdc: 1}},(err,res)=>{
    if(err){
      console.log("cancel");
    }else{
      console.log('added'); 
    }
   })

    } 

res.render("project/mark", { result: "" , me : "group number" })
}catch(err){
res.render("project/mark", { result: "" , me : "group number" })

}
})


app.post('/findmark',(req,res)=>{

var search = req.body.find;

var mainsearch = Student.find({
  group_no : search 
  }).sort();

mainsearch.exec(function(err,data){
if(err) throw err;
res.render('project/mark', { result :data , me : search});
  });


})

// everyone search
app.get('/sdc',(req,res)=>{


var mainsearch = Student.find({
  sdc : {$gt :1 } 
  }).sort({ level: 1 });

mainsearch.exec(function(err,data){
if(err) throw err;
res.render('project/sdc', { result: data });
  });

})


// user creation
app.post('/create',(req,res)=>{
res.render("project/create")
})

app.post('/created',(req,res)=>{
  
var user = req.body;

  var newuser = new Student({
    full_name: user.name,
    matric_no: user.matric,
    department:user.dep,
    level: user.level,
    group_no: user.group,
    seat_no: user.seat
  })

newuser.save((err,Student)=>{
  if(err){
    console.log('unsucessful');
  }else{
    console.log('Created');  
  }
})
res.render("project/create")
})





// search
app.get('/search',(req,res)=>{

res.render('project/find' ,{result : "" , me : "name/matric no/Year-Month-Date"});
  
})
// find
app.post('/find',(req,res)=>{

var search = req.body.find;
var mainsearch = Student.find({$or :[{full_name : { $regex: search} },{matric_no: { $regex: search} },
  {"warning_letter.day" : { $regex: search }  }]}).sort({ level: 1 });

mainsearch.exec(function(err,data){
if(err) throw err;

res.render('project/find', { result: data , me : search });
  });

})



app.get('*',(req,res)=>{
  res.render("project/home")
})
app.listen(PORT);
