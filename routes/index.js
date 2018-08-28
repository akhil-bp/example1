var express = require('express');
var router = express.Router();
var librarydir = require('../lib/library');
var debug = require('debug')('example1:index');
var userService = require('../services/user.service');//requires db statements
var validateSchema = require('../jsonvalidator/valid');//for validation
var bcrypt = require('bcrypt');//encrypt
var jwt = require('jsonwebtoken');
var config = require('../config');
const app = express();
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');//unlink or storage

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express', libraries: librarydir.msg });
});



router.get('/logout', async function (req, res, next) {
  try {
    res.clearCookie('token');
    //if(removcookie == ""){
    res.redirect('/login');
    
  } catch (e) {
    res.redirect('/login');
  }
});

//login
router.get('/login', async function (req, res, next) {
  try {
    res.locals.success = true;
    res.render('index');
    
  } catch (e) {
    res.render('index');
  }
});
//for view in edit page....another type of then..catch function
router.post('/login', async function (req, res, next) {
  try {
    var mail = req.body.temail;
    var myPlaintextPassword = req.body.password;
    var user = await userService.getUser({ email: mail });
    if(user){
      var dbpswd = user.password;
      var pic = user.profilePicFile;
      
      //console.log(dbpswd);
      var rs = await bcrypt.compare(myPlaintextPassword, dbpswd);
      //console.log(rs);
      if(rs){
        var token = jwt.sign({ name: user.name,id: user._id,role: user.role }, config.secret);// secret : "hgh"
        console.log(token);
        // res.cookie('token', token, { signed: true });//'token'-> token name
        res.json({status:"successfully logged",token:token,Pic:pic});
        
        // res.locals.success = true;
      } else {
        res.json({status:"error in password"});
        // res.locals.success = false;
        //res.send('password incorrect');
      }
      
    }
    else {
      //res.send('incorrect user email or password');
      res.json({status:"invalid email address"});
      // res.locals.success = false;
    }
  } catch (e) {
    res.json({status:"error in  email or password"});
  }

});

router.get('/contactus', function (req, res, next) {
  res.render('contactus', { title: 'contactus' });
});
router.post('/contactus', function (req, res) {
  //res.render('contactus');
  let name = req.body.t1;
  let email = req.body.t2;
  let message = req.body.t3;
  //console.log(name ,email ,message);.....synchronous
  //but debug is asynchronous
  debug(name, email, message);//SET DEBUG=example1:* & npm start.......to view this type it in  cmd
  //var debug = require('debug')('example1:index');..to top
  res.send('got a post request' + name + email + message);
});




router.get('/userform', function (req, res, next) {
  res.render('userform');
});

/*router.post('/userform', validateSchema({ schemaName: 'new-user1', view: 'userform' }), function(req, res) {
  let usr = {
    name: req.body.tname, 
    email: req.body.temail,
    date: req.body.tdate,
    status: req.body.tstatus,
    role: req.body.trole,
    password: req.body.tpassword
  };
  console.log(usr);
  userService.createUser(usr)//createUser required from userService.....see require('') top
  .then(function(result) { 
    res.locals.success = true;
    res.render('userform');
  })
  .catch(function(e){
    console.log(e);
    res.locals.success = false;
    res.render('userform');
  });
}); */
//then catch ->>>> async await
router.post('/userform', validateSchema({ schemaName: 'new-user1', view: 'userform' }), async function (req, res) {
  //res.render('contactus');
  

  try {
    //User.findOne({ email: req.body.temail }, async function (err, users) {
    var chk = await userService.getUser({ email: req.body.temail })
    //console.log(req.body.temail)
    if (chk) {
      res.json({status:"error",response:'mail already exist!'});
    } else {
      req.body.tpassword = req.body.tpassword.trim();//delete space before and after
      req.body.tconfpassword = req.body.tconfpassword.trim();
      if (req.body.tpassword && (req.body.tpassword === req.body.tconfpassword)) {

        const saltRounds = 10;
        //var password = 'kllklklk';
        var hash = await bcrypt.hash(req.body.tpassword, saltRounds);
        let usr = {
          name: req.body.tname,
          email: req.body.temail,
          date: req.body.tdate,
          status: req.body.tstatus,
          role: req.body.trole,
          password: hash
        };
        //console.log(usr);
        var temp = await userService.createUser(usr)//createUser required from userService.....see require('') top
        res.locals.success = true;
        res.json({status:"success", msg:'data inserted successfuly!'});
      } else {
        res.json({status:"error2", msg:'password not matching!'});
      }
    }
  }

  catch (e) {
    console.log(e);
    res.locals.success = false;
    res.render('userform');
  }
});
//console.log(name ,email ,message);.....synchronous
//but debug is asynchronous
//debug(usr);//SET DEBUG=example1:* & npm start.......to view this type it in  cmd
//var debug = require('debug')('example1:index');..to top
//res.render('userform', { title: 'userform', success: true });
//or
//res.locals.title =  'userform';
//res.locals.success =  true;

router.get('/usertable', async function (req, res) {
  //res.render('contactus');
  

  try {
    //User.findOne({ email: req.body.temail }, async function (err, users) {
    var result = await userService.getUsers();
    //console.log();
    
      res.json({response:result});
    
  }

  catch (e) {
    console.log(e);
  }
});

router.post('/delete', async function (req, res, next) {
  try {
    var o_id = req.body.id;
    var result = await userService.deleteUser({ _id: o_id });

  } catch (e) {

  }
});
router.get('/edit/:id', async function (req, res, next) {
  try {
    var o_id = req.params.id;
    var user = await userService.getUser({ _id: o_id });
    res.json({status:"success", user: user })
  } catch (e) {
    res.json({status:'error'})
  }
});




 


// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended: true}));
 
// app.use(function (req, res, next) {
//   res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
//   res.setHeader('Access-Control-Allow-Methods', 'POST');
//   res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
//   res.setHeader('Access-Control-Allow-Credentials', true);
//   next();
// });
 
// app.get('/api', function (req, res) {
//   res.end('file catcher example');
// });
var storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './public/uploads');
  },
  filename: function (req, file, callback) {
    var filename = file.originalname.split(" ").join("_");
    var newname= Date.now() + '-' + filename;
    console.log(file,"thhi is new file");
    callback(null, newname);
    
  }
});

var upload = multer({ storage: storage });
router.post('/api/upload',upload.single('photo'), function (req, res) {
  // console.log(req.file.filename,"image name got");
    if (!req.file) {
        console.log("No file received");
        return res.json({success: false});
    
      } else {
        console.log('file received');
        
        return res.json({
          success: true,
          picname:req.file.filename 
        })
      }
});
 

router.post('/picupload', async function (req, res, next) {
  try {
    var o_id = req.body.id;
    var pic = req.body.picname;
    var oldFileName = req.body.oldimage;
    console.log(pic,"got id");
    var edituser = await userService.updateUser({ _id: o_id },
      {
        $set:
        {      
          profilePicFile: pic
          
        }
      });
      fs.unlink('./public/uploads/' + oldFileName, (err) => {
        console.log(err);
      });
    res.json({ success: true, user: 'success' });
  } catch (e) {

    res.json( { success: false })
  }

});
// const PORT = process.env.PORT || 3000;
 
// app.listen(PORT, function () {
//   console.log('Node.js server is running on port ' + PORT);
// });
router.post('/edit', async function (req, res, next) {
  try {
    var o_id = req.body.id;
    // console.log(o_id,"got id");
    var edituser = await userService.updateUser({ _id: o_id },
      {
        $set:
        {
          name: req.body.name.trim(),
          email: req.body.email,  
          role: req.body.role,        
          status: req.body.status
          
        }
      });
    res.json({ success: true, user: 'success' });
  } catch (e) {

    res.json( { success: false })
  }

});
module.exports = router;//see bin/www

