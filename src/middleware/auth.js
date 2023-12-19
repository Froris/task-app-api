const { verify } = require("jsonwebtoken");
const { User } = require("../mongoose/models/user");

async function auth(req, res, next) {
	try {
		const token = req.header('Authorization').replace('Bearer ', '')
		const decoded = verify(token, process.env.JWT_SECRET)
		const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })

		if (!user) {
			throw new Error('')
		}

		// We can add custom properties to req object.
		// Here we add the user we found earlier in order to prevent searching them again
		// in a route handler.
		req.token = token
		req.user = user
		next()
	} catch (e) {
		console.log(e.toString())
		res.status(503).send('Unauthorized')
	}
}

module.exports = auth