const express = require('express')
const { Task } = require("../mongoose/models/task")
const auth = require("../middleware/auth");
const { ObjectId } = require("mongodb");
const { User } = require("../mongoose/models/user");

const router = express.Router()

/**
 * 	In order to save our Document to DB we can use two methods:
 * 	1. Create an instance of a Document and then save it to DB using ".save()"
 *  2. Without creating an instance using one of the Model methods.
 */

// Tasks
router.post('/tasks', auth, (req, res) => {
	const task = {
		...req.body,
		owner: req.user._id
	}

	Task.create(task).then((result) => {
		console.log('[TASK_CREATE] Success:', result)

		res.status(201).send({
			message: 'Task created!',
			data: {
				description: result.description,
				completed: result.completed,
				_id: result._id
			}
		})
	}).catch((err) => {
		console.log('[TASK_CREATE] Error:', err)

		res.status(400).send({ error: "Unable to create a new task." })
	})
})

router.patch('/tasks/:id', auth, async (req, res) => {
	const updates = Object.keys(req.body)
	const allowedUpdates = ['description', 'completed']
	const isValidOperation = updates.every((update) => allowedUpdates.includes(
			update))

	if (!isValidOperation) {
		return res.status(400)
		.send({ isUpdated: false, message: 'Invalid updates!' })
	}

	// Mongoose will parse Object.id for us
	const _id = req.user._id

	if (!ObjectId.isValid(_id)) {
		return res.send({
			isUpdated: false,
			message: 'Search failed: Invalid id.'
		});
	}

	try {
		const updatedTask = await Task.findOneAndUpdate(
				{
					_id: req.params.id,
					owner: _id
				},
				req.body,
				{ new: true, runValidators: true }
		)

		if (!updatedTask) {
			return res.status(404)
			.send({ isUpdated: false, message: "No task was found." })
		}

		res.send({ isUpdated: true, data: updatedTask })
	} catch (err) {
		res.status(400).send({ error: err.message })
	}

})

router.delete('/tasks/:id', auth, async (req, res) => {
	// Mongoose will parse Object.id for us
	const _id = req.user._id

	if (!ObjectId.isValid(_id)) {
		return res.send({
			isDeleted: false,
			message: 'Search failed: Invalid id.'
		});
	}

	try {
		const deletedTask = await Task.findOneAndDelete({
			_id: req.params.id,
			owner: _id
		})

		if (!deletedTask) {
			return res.status(404)
			.send({ isDeleted: false, message: "No task was found." })
		}

		res.send({ isDeleted: true, data: deletedTask })
	} catch (err) {
		res.status(400).send({ error: err.message })
	}
})

router.get('/tasks', auth, async (req, res) => {
	const user = await User.findById(req.user._id)
	const match = {}
	const sort = {}

	// ?sortBy=createdAt:desc
	if (req.query.sortBy) {
		const sortParts = req.query.sortBy.split(':')
		sort[sortParts[0]] = sortParts[1] === 'desc' ? -1 : 1
	}

	if (req.query.completed) {
		match.completed = req.query.completed === 'true'
	}

	// Populate - https://mongoosejs.com/docs/api/document.html#Document.prototype.populate()
	// !!! IMPORTANT !!! options object is nothing more, than a way to pass an options for Model.query (.find, findOne etc.)
	// Model.query options are listed here - https://mongoosejs.com/docs/api/query.html#Query.prototype.setOptions()
	user.populate({
		path: 'tasks', match, options: {
			limit: parseInt(req.query.limit), // Ignored if not a number
			skip: parseInt(req.query.skip), // ( pageNumber - 1 ) * nPerPage ) - how many results to skip.
			sort
		}
	}).then((user) => {
		if (!user.tasks.length) {
			return res.send({
				searchResult: false,
				message: 'Search completed: No tasks was found.'
			})
		}

		res.send({ searchResult: true, data: user.tasks })
	}).catch((err) => {
		console.log('[TASKS_SEARCH] Error:', err)
		res.status(500).send()
	})
})

router.get('/tasks/:id', auth, (req, res) => {
	const _id = req.params.id

	if (!ObjectId.isValid(_id)) {
		return res.send({
			searchResult: false,
			message: 'Search failed: Invalid id.'
		});
	}

	Task.findOne({ _id, owner: req.user._id }).then((task) => {
		if (!task) {
			return res.status(404).send({
				searchResult: false,
				message: 'Search completed: No task was found.'
			})
		}

		res.send({ searchResult: true, data: task })
	}).catch((err) => {
		console.log('[TASKS_unique_SEARCH] Error:', err)
		res.status(500).send()
	})
})

module.exports = router