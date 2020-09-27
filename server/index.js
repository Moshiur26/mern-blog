const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const { User } = require('./models/user')
const config = require('./config/key')
const { auth } = require('./middleware/auth')

const app = express()



mongoose.connect(config.mongoURI,
    { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true})
    .then(()=>console.log("DB successfully connected...!"))
    .catch(err=>console.log("Error: "+err))

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cookieParser())


app.get('/api/user/auth', auth, (req, res) => {
    res.status(200).json({
        isAuth: true,
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        lastname: req.user.lastname,
        role: req.user.role
    })
})


app.post('/api/users/register', (req, res) => {
    const user = new User(req.body)
    user.save((err, user) => {
        if(err) return res.json({ success: false, err})
        res.status(200).json({ 
            success: true,
            user
        })
    })
   
})

app.post('/api/user/login', (req, res) => {
    User.findOne({ email: req.body.email }, (err, user) => {
        if(err) return res.json({
            loginSuccess: false,
            message: "Auth failed, email not found"
        })

        user.comparePassword(req.body.password, (err, isMatch) => {
            if(!isMatch) return res.json({
                loginSuccess: false,
                message: "wrong password"
            })
            console.log("password is matched...");
        })

        user.generateToken((err, user) => {
            if(err) return res.status(400).send(err)
            res.cookie("x_auth", user.token)
                .status(200)
                .json({
                    loginSuccess: true
                })
        })
    })
})


app.get('/api/user/logout', auth, (req, res) => {
    User.findOneAndUpdate({_id: req.user._id}, {token: ''}, {useFindAndModify: false}, (err, doc) => {
        if (err) return res.json({ success: false, err});
        return res.status(200).json({
            logoutSuccess: true
        })
    })
})

app.get('/', (req, res) => {
    res.send("Hello Blog..")
})

const port =process.env.PORT || 5000

app.listen(port, () => {
    console.log(`Server Running Ar Port : ${port}...`);
})