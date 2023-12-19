const mongoose = require('mongoose');

main().catch((err) => console.log(err))

async function main() {
	// DON'T FORGET to provide a DB NAME at the end of URL string!
	// Unlike MongoClient, mongoose needs a DB name in URL string.
	await mongoose.connect(process.env.MONGODB_URL);
}






