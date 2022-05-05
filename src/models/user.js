const mongoose = require('mongoose')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const Task = require('./task')


const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        trim: true,
        validate: function(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error("Password cannot contain word password")
            }
        }
    },
    age: {
        type: Number,
        default: 0,
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, { timestamps: true })

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.methods.toJSON = function() {
    const user = this
    const userObject = user.toObject()
    delete userObject.password
    delete userObject.tokens
    return userObject
}

userSchema.methods.generateAuthTokenAndSave = async function() {
    const user = this
    console.log(user._id)
    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET)
    user.tokens = user.tokens.concat({ token })
    await user.save()
    return token

}

userSchema.statics.findUserByCredentials = async function(email, password) {
    console.log("Find user")
    const user = await User.findOne({ email })
    if (!user) {
        throw new Error("Invalid credentials")
    }
    const userExist = await bcrypt.compare(password, user.password)
    if (!userExist) {
        throw new Error("Invalid credentials")
    }
    return user

}

userSchema.pre('save', async function(next) {
    console.log("Before save")
    const user = this
    if (!user.isModified('password')) return next();

    const pwd = await bcrypt.hash(user.password, 8)
    user.password = pwd
    next()
})

//Delete tasks when user is deleted
userSchema.pre('remove', async function(next) {
    const user = this
    await Task.deleteMany({ owner: user._id })
    next()
})


const User = mongoose.model('user', userSchema)


module.exports = User