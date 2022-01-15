const express = require('express')
const Task = require('../models/task')
const User = require('../models/user')
const auth = require('../middleware/auth')
const router = express.Router()

router.post('/tasks', auth, async (req, res) => {
    try {
        const task = new Task({
            ...req.body,
            owner: req.user._id
        })
        const response = await task.save()
        if (!response) {
            return res.status(400).send()
        }
        res.status(201).send(response)

    } catch (error) {
        res.status(500).send(error)

    }
})

// Filtering the data //Get /tasks?completed=true OR /tasks?completed=false
// Pagination //Get /tasks?limit=2
//Get /tasks?completed=true&skip=2

//Sorting
//Get /tasks?sortBy=createdAt_desc
router.get("/tasks",  auth, async(req, res) => {
    const match ={}
    const sort = {}
    if(req.query.completed){
        match.completed = req.query.completed === 'true'
    }

    if(req.query.sortBy){
        const parts = req.query.sortBy.split('_')
        sort[parts[0]] = parts[1]==='desc'? -1 : 1
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options:{
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        })
        res.status(200).send(req.user.tasks)
        
    } catch (error) {
        res.status(500).send(error)                
    }
})

router.patch('/tasks/:id', auth, async(req, res)=>{
    const validUpdates = ["description", "completed"]
    const updates = Object.keys(req.body)
    const isValid = updates.every(update=> validUpdates.includes(update))
    if(!isValid){
        return res.status(401).send("Invalid operation")
    }

    try {
        const _id = req.params.id
        const task = await Task.findOne({_id, owner: req.user._id})
        if(!task){
            return res.status(404).send()
        }
        updates.forEach(update=>{
            task[update] = req.body[update]
        })
        await task.save()
        res.status(201).send(task)
    } catch (error) {
         res.status(500).send(error)        
    }
})

router.delete('/tasks/:id',auth, async(req, res)=>{
    try {
        const _id = req.params.id
        const task = await Task.findOneAndDelete({_id, owner: req.user._id})
        if(!task){
            return res.status(404).send()
        }
        res.status(202).send(task)
        
    } catch (error) {
        res.status(500).send(error)        
    }
})

module.exports = router