const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require("../middleware/auth")
const router = express.Router()

router.post('/users', async (req, res) => {
    try {
        const user = new User(req.body)
        // const response = await user.save()
        const token = await  user.generateAuthTokenAndSave()
        if (!token) {
            return res.status(400).send()
        }
        res.status(201).send({user, token})
    } catch (error) {
        res.status(500).send(error)
    }
})

router.post('/users/login', async(req, res)=>{
    try {
        const user = await User.findUserByCredentials(req.body.email, req.body.password) 
        console.log("after finding") 
        const token = await user.generateAuthTokenAndSave()
        res.status(200).send({user, token})      
    } catch (error) {
        res.status(500).send("Invalid credentials")                
    }   
})

router.post('/users/logout', auth, async (req, res)=>{
    try {
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
        
    } catch (error) {
        res.status(500).send()        
    }
})

router.post("/users/logoutAll",  auth, async(req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()   
        console.log("Working fine") 
        res.status(200).send({"message": "logout successfully"})    
    } catch (error) {
        res.status(500).send()
        
    }
})


router.get("/users/me",  auth, async(req, res) => {
    res.send(req.user)
})

router.patch('/users/me', auth, async(req, res)=>{
    const validUpdates = ["name", "email", "password", "age"]
    const updates = Object.keys(req.body)
    const isValid = updates.every(item=> validUpdates.includes(item) )
    if(!isValid){
        return res.status(400).send("Invalid operation")
    }

    try {
        // const _id = req.user._id
        // const user = await User.findById({_id})
        // if(!user){
        //     return res.status(404).send()
        // }
        updates.forEach(update=>{
            req.user[update] = req.body[update]
        })
        await req.user.save()
        res.status(201).send(req.user)
    } catch (error) {
         res.status(500).send(error)        
    }
})

router.delete('/users/me', auth, async(req, res)=>{
    try {
        // const _id = req.user._id
        // const user = await User.findByIdAndDelete(_id)
        await req.user.remove()
        res.status(202).send(req.user)
        
    } catch (error) {
        res.status(500).send(error)        
    }
})

const upload = multer({ 
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/gm)){
            return cb( new Error('Must upload an image file'))
        }
        cb(undefined, true)
    }

})

//handling express errors using extra call back
//Upload a user profile
//using sharp to save uniform file types and resize

router.post('/users/me/avatar', auth, upload.single('avatar'), async(req, res)=>{
    const buffer = await sharp(req.file.buffer).resize({width:250, height:250}).png().toBuffer()

    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next)=>{
    res.status(400).send({ error: error.message})
})

router.delete('/users/me/avatar', auth, async(req, res)=>{
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async(req, res)=>{
    try {

        const _id = req.params.id
        const user = await User.findById(_id)
        if(!user || !user.avatar){
            throw new Error()
        }     
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (error) {

        res.send(error)
        
    }

})

module.exports = router
