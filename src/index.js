const express = require("express");
require("./db/mongoose")
const userRouter = require('./routes/user')
const taskRouter = require('./routes/task')



const app = express();

const PORT = process.env.PORT

// app.use((req, res, next)=>{
//     res.send("Under maintanance")
// })
app.use(express.json())
app.use(userRouter)
app.use(taskRouter)


app.get('/hello', (req, res) => {
    res.send({
        name: "Abhishek"
    })
})


app.listen(PORT, () => {
    console.log("Node app is running on ", PORT)
})


