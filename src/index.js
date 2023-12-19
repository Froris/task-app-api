const express = require('express')
const usersRouter = require('./routes/users')
const tasksRouter = require('./routes/tasks')
require('./mongoose/mongoose')
const { lookup, pretty } = require("geoip-lite");

const PORT = process.env.PORT || 3000
const app = express()

// Automatic body parse
app.use(express.json())

app.use(usersRouter)
app.use(tasksRouter)

app.listen(PORT, () => {
	console.log('Server is up and running on port: ', PORT)
})