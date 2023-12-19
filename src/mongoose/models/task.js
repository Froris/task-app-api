const mongoose = require("mongoose");
const validator = require('validator');

// Schemas - https://mongoosejs.com/docs/guide.html
// Schemas validation - https://mongoosejs.com/docs/validation.html#built-in-validators
// Schemas string options - https://mongoosejs.com/docs/api/schemastringoptions.html

const TaskSchema = new mongoose.Schema({
	description: {
		type: String,
		required: [true, 'Description field cannot be empty.']
	},
	completed: {
		default: false,
		type: Boolean,
		required: [true, 'The task must have a "completed" status.']
	},
	owner: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: 'User'
		// With ref prop we can create relation btw Task and User.
		// Relation allows us to turn owner id into full user profile in our route handlers by populating Task.owner .
	}
}, { timestamps: true })

const Task = mongoose.model('Task', TaskSchema)

module.exports = {
	Task
}