const express = require('express');
// const { query } = require('../connection');
const connection = require('../connection')
const router = express.Router();

const jwt =require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();
var auth = require('../services/authentication');
var checkRole = require('../services/checkRole');

router.post('/signup',(req,res)=>{
    let user = req.body;
    query = "select email,password,role,status from user where email=?"
    connection.query(query,[user.email],(err,results)=>{
        if(!err){
            if(results.length <= 0){
                query = "insert into user(name,contactNumber,email,password,status,role) values(?,?,?,?,'false','user')"
                connection.query(query,[user.name,user.contactNumber,user.email,user.password],(err,results)=>{
                    if(!err){
                        return res.status(200).json({message:"Successfully Registered"});
                    }else{
                        return res.status(500).json(err);
                    }
                })
            }else{
                return res.status(400).json({message:"Email Already exits."});
            }
        }else{
            return res.status(500).json(err);
        }
    })
})

router.post('/login',(req,res)=>{
   let user = req.body;
    query = "select email,password,role,status from user where email=?";
    connection.query(query,[user,email],(err,results)=>{
        if(!err){
            if(results.length<=0 || results[0].password != user.password){
                return res.status(401).json({message:"Incorrect Username and password"});
            }else if(results[0].status === 'false'){
                return res.status(401).json({message:'Wait for Admin Approval'});
            }
            else if(results[0].password == user.password){
                let response = {email:results[0].email, role:results[0].role}
                let accessToken = jwt.sign(response,process.env.ACCESS_TOKEN,{expiresIn:'8h'})
               return res.status(200).json({token:accessToken});
            }
            else{
                return res.status(400).json({message:"Something went wrong.Please try again later"});
            }
        }
        else{
            return res.status(500).json(err);
        }
    })
});

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user:process.env.EMAIL,
        pass: process.env.PASSWORD
    }
})

router.post('/forgotpassword', (req,res)=>{
    const user = req.body;
    query="select email,password,role,status from user where email=?";
    connection.query(query,[user.email],(err,results)=>{
        if(!err){
            if(results <=0){
                return res.status(200).json({message:"Password sent successfully to your email"});
            }else{
                var mailOptions = {
                    from: process.env.EMAIL,
                    to: results[0].email,
                    subject: 'Password by Cafe Managemnt System',
                    html: '<p><b>Your login details for cafe managemnt system</b></p>'
                };
                transporter.sendMail(mailOptions,function(error,info){
                    if(error){
                        console.log(error)
                    }else{
                        console.log('Email sent' + info.response);
                    }
                });
                return res.status(200).json({message:'Password sent successfully to your email.'});
            }
        }else{
            return res.status(500).json(err);
        }
    })
})

router.get('/get',(req,res)=>{
    var query = "select id,name,email,contactNumber,status from user where role='user'";
    connection.query(query,(err,results)=>{
        if(!err){
            return res.status(200).json(results);
        }else{
            return res.status(500).json(err);
        }
    })
})

// router.get('/get',auth.authenticateToken,checkRole.checkRole(req,res)=>{
//     var query = "select id,name,email,contactNumber,status from user where role='user'";
//     connection.query(query,(err,results)=>{
//         if(!err){
//             return res.status(200).json(results);
//         }else{
//             return res.status(500).json(err);
//         }
//     })
// })

router.patch('/update',(req,res)=>{
    let user = req.body;
    var query = "update user status=? where id=?";
    connection.query(query, [user.status,user.id],(err,results)=>{
        if(!err){
            if(results.affectedRows == 0){
                return res.status(404).json({message:'User id is not exist'});
            }
            return res.status(200).json({message:'User Updated Successfully!'});
        }else{
            return res.sendStatus(500).json(err);
        }
    })
})

// router.patch('/update',auth.authenticateToken,checkRole.checkRole(req,res)=>{
//     let user = req.body;
//     var query = "update user status=? where id=?";
//     connection.query(query, [user.status,user.id],(err,results)=>{
//         if(!err){
//             if(results.affectedRows == 0){
//                 return res.status(404).json({message:'User id is not exist'});
//             }
//             return res.status(200).json({message:'User Updated Successfully!'});
//         }else{
//             return res.sendStatus(500).json(err);
//         }
//     })
// })

router.get('/checkToken',(req,res)=>{
    return res.status(200).json({message:"true"});
})

// router.get('/checkToken',auth.authenticateToken,(req,res)=>{
//     return res.status(200).json({message:"true"});
// })

router.post('/changePassword',auth.authenticateToken,(req,res)=>{
    const user = req.body;
    const email = res.locals.email;
    var query = "select * from user set password=? where email=?";

    connection.query(query,[email,user.oldPassword],(err,results)=>{
        if(!err){
            if(results.length <=0){
                return res.status(400).json({message:'Incorrect Old password'})
            }
            else if(results[0].password == user.oldPassword){
                query = "update user set password=? where email=?"
                connection.query(query,[user.newPassword,email],(err,results)=>{
                    if(!err){
                        return res.sendStatus(200).json({message:"Password updated successfully"})
                    }
                    else{
                        return res.status(500).json(err);
                    }
                })
            }
            else{
                return res.status(400).json({message:"Something went wrong. Please try again later"})
            }
        }
        else{
            return res.status(500).json(err);
        }
    })
})

module.exports = router;