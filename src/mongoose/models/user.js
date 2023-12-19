// Schemas - https://mongoosejs.com/docs/guide.html
// Schemas validation - https://mongoosejs.com/docs/validation.html#built-in-validators
// Schemas string options - https://mongoosejs.com/docs/api/schemastringoptions.html

const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Task } = require("./task");

// Schemas - https://mongoosejs.com/docs/guide.html
// Schemas validation - https://mongoosejs.com/docs/validation.html#built-in-validators
// Schemas string options - https://mongoosejs.com/docs/api/schemastringoptions.html

const UserSchema = new mongoose.Schema({
	name: { trim: true, type: String, required: true },
	email: {
		trim: true,
		type: String,
		unique: true,
		required: true,
		lowercase: true,
		validate(value) {
			if (!validator.isEmail(value)) {
				throw new Error('Email is invalid.')
			}
		}
	},
	password: {
		required: true,
		type: String,
		minLength: 6,
		trim: true,
		validate(value) {
			if (value.toLowerCase().includes('password')) {
				throw new Error('The password must be unique!')
			}
		}
	},
	age: Number,
	tokens: [],
	avatar: {
		type: Buffer
	}
}, { timestamps: true })

// Virtuals - https://mongoosejs.com/docs/tutorials/virtuals.html
// Here, with help of the virtual method we created setup for populating User with tasks.
// It's like define a relation property in Prisma model. Virtual property won't be saved to DB, but it will
// be present after populating User with tasks and sending it back to a client.
UserSchema.virtual('tasks', {
	ref: 'Task',
	localField: '_id',
	foreignField: "owner"
})

// schema.statics and schema.methods allow us to define our own methods on a different levels.
// For example, if we need to do some general operations, like search, we can create general
// function for this and provide it to "statistics". But if we need to generate token or something
// for an individual user, we need access to its '.this'.

// more: https://mongoosejs.com/docs/guide.html#methods

UserSchema.methods.generateAuthToken = async function () {
	const user = this
	const token = jwt.sign({ _id: user._id.toString() }, 'thisismysecret')
	user.tokens = user.tokens.concat([{ token }])
	await user.save()
	return token
}


UserSchema.methods.toJSON = function () {
	const user = this
	const userObject = user.toObject()

	delete userObject.password
	delete userObject.tokens
	delete userObject.avatar

	return userObject
}

UserSchema.statics.findByCredentials = async function (email, password) {
	const user = await User.findOne({ email })

	if (!user) throw new Error('Unable to login.')

	const isMatch = await bcrypt.compare(password, user.password)

	if (!isMatch) throw new Error('Unable to login.')

	return user
}

// Middleware - https://mongoosejs.com/docs/middleware.html
// Before saving/creating a user we must encrypt the password. We can do this right here, using middleware
// The middleware allows us to do this before (schema.pre()) or after (schema.post()) saving/creating/updating
UserSchema.pre('save', async function (next) {
	const user = this

	if (user.isModified('password')) {
		user.password = await bcrypt.hash(user.password, 8)
	}
})

UserSchema.pre('deleteOne', { document: true }, async function (next) {
	const user = this

	await Task.deleteMany({ owner: user._id })
	next()
})

// Pre (API ref) - https://mongoosejs.com/docs/api/schema.html#Schema.prototype.pre()
// Pre (docs) - https://mongoosejs.com/docs/middleware.html#pre

const User = mongoose.model('User', UserSchema)

module.exports = { User }