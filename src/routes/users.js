const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const { User } = require("../mongoose/models/user")
const { ObjectId } = require("mongodb");
const auth = require("../middleware/auth");
const { sendEmail, welcomeHTMLContent } = require("../email");

const router = express.Router()
const avatarUpload = multer({
	// dest: 'avatars/', // If dist is not specified, multer will pass the file into cb function
	limits: { fileSize: 1000000 }, // File size in bytes
	fileFilter(req, file, cb) {
		if (!file.originalname.match('^.*\.(jpg|jpeg|png)$')) {
			return cb(new Error('Allowed image formats: .jpg, .jpeg, .png'))
		}

		cb(undefined, true)
	}
})

/**
 * 	In order to save our Document to DB we can use two methods:
 * 	1. Create an instance of a Document and then save it to DB using ".save()"
 *  2. Without creating an instance using one of the Model methods.
 */

// Users
router.post('/users', async (req, res) => {
	// Async/await example (preferred way)
	try {
		const newUser = await User.create(req.body)
		console.log('[USER_CREATE] Success:', newUser)

		res.status(201).send({
			message: 'User created!',
			data: { name: newUser.name, _id: newUser._id }
		})
	} catch (err) {
		console.log('[USER_CREATE] Error:', err)
		res.status(400).send({ error: 'Unable to create a new user.' })
	}
})

router.post('/users/signup', async (req, res) => {
	try {
		const isExists = await User.findOne({ email: req.body.email })

		if (isExists) {
			return res.send({ message: 'User already exists. Try to log in instead.' })
		}

		const user = await User.create({ ...req.body, tokens: [] })
		const token = await user.generateAuthToken()

		sendEmail('gamefoxmail@gmail.com', 'Sign up', welcomeHTMLContent)

		res.status(201).send({
			message: 'User registered!',
			data: { user, token }
		})
	} catch (e) {
		console.log('[USER_SIGNUP] Error:', e)
		res.status(400).send({ error: 'Unable to register a new user.' })
	}
})

// An array of tokens needed for multiple sessions.
// For example, when someone sharing their account with others.
router.post('/users/login', async (req, res) => {
	try {
		// We can define our own static methods in Models
		const user = await User.findByCredentials(req.body.email, req.body.password)
		const token = await user.generateAuthToken()
		res.send({ user, token })
	} catch (e) {
		const formattedError = e.toString().split('Error: ')[1]
		res.status(400).send({ error: formattedError })
	}
})

router.post('/users/logout', auth, async (req, res) => {
	try {
		req.user.tokens = req.user.tokens.filter((token) => token !== req.token)
		// We have access to .save() method here because Mongoose documents track changes.
		// We can use document methods or queries: https://mongoosejs.com/docs/api/query.html#Query()
		await req.user.save()

		res.send()
	} catch (e) {
		res.status(500).send()
	}
})

router.patch('/users/:id', auth, async (req, res) => {
	const updates = Object.keys(req.body)
	const allowedUpdates = ['name', 'email', 'password', 'age']
	const isValidOperation = updates.every((update) => allowedUpdates.includes(
			update))

	if (!isValidOperation) {
		return res.status(400)
		.send({ isUpdated: false, message: 'Invalid updates!' })
	}

	try {
		const updatedUser = req.user

		updates.forEach((update) => updatedUser[update] = req.body[update])

		await updatedUser.save()
		res.send({ isUpdated: true, data: updatedUser })
	} catch (err) {
		res.status(400).send({ error: err.message })
	}
})

router.get('/users/me', auth, async (req, res) => {
	res.send(req.user)
})

router.get('/users/:id', (req, res) => {
	// Mongoose will parse Object.id for us
	const _id = req.params.id

	if (!ObjectId.isValid(_id)) {
		return res.send({
			searchResult: false,
			message: 'Search failed: Invalid id.'
		});
	}

	User.findById(_id).then((user) => {
		// Empty search result is not an error for MongoDB
		if (!user) {
			return res.status(404)
			.send({
				searchResult: false,
				message: 'Search completed: No user was found.'
			})
		}

		res.send({ searchResult: true, data: user })
	}).catch((err) => {
		console.log('[USERS_UNIQUE_SEARCH] Error:', err)
		res.status(500).send()
	})
})

router.get('/users/:id/avatar', async (req, res) => {
	try {
		const user = await User.findById(req.params.id)

		if (!user || !user.avatar) {
			throw new Error()
		}

		res.set('Content-Type', 'image/png')
		res.send(user.avatar)

	} catch (e) {
		res.status(404).send()
	}
})


router.delete('/users/me', auth, async (req, res) => {
	try {
		await req.user.deleteOne(req.user._id)
		res.send(req.user)
	} catch (e) {
		console.log('[USERS_DELETE] Error:', e.toString())
		res.status(500).send()
	}
})

// In some cases we have errors, which are thrown inside middlewares. We can't catch such errors in try/catch block,
// and that's why we need to use a special function in our routes. This function passed as a 4th argument to the route handler.
router.post(
		'/users/me/avatar',
		auth,
		avatarUpload.single('avatar'),
		async (req, res) => {
			// Sharp docs - https://sharp.pixelplumbing.com/api-constructor
			const buffer = await sharp(req.file.buffer)
			.resize({ width: 250, height: 250 })
			.png()
			.toBuffer()

			req.user.avatar = buffer
			await req.user.save()
			res.send({ message: 'Avatar has been upload successfully!' })
		},
		(error, req, res, next) => {
			res.status(400).send({ error: error.message })
		}
)

module.exports = router