const express = require("express");
var cors = require('cors')
const Task = require('./models/task')


require("./db/mongoose")
const userRouter = require('./routes/user')
const taskRouter = require('./routes/task')



const app = express();

const PORT = process.env.PORT

// app.use((req, res, next)=>{
//     res.send("Under maintanance")
// })
app.use(express.json())
app.use(cors())
app.use(userRouter)
app.use(taskRouter)



app.get('/hello', async(req, res) => {
    try {
        const tasks = await Task.find({})
        if (!tasks) {
            throw new Error()
        }
        res.send(tasks)

    } catch (error) {
        res.send(500)

    }
})


app.listen(PORT, () => {
    console.log("Node app is running on ", PORT)
})