const nodemailer = require('nodemailer');

const welcomeHTMLContent = `
   <html>
        <body>
          <h1>Thank you for joining us!</h1>
          <h2 style='color: darkseagreen'>It's Task App's welcoming message.</h2>
          <p style='color: darkgrey;'>This is a message from NodeMailer! Thank you for joining us! We are happy to have you here.</p>
       </body>
   </html>
`

const bbHTMLContent = `
	<html>
	    <body>
	       <h1>We're sorry to see you go!</h1>
	       <h2 style='color: firebrick'>This is Task App's farewell message.</h2>
	       <p style='color: darkgrey;'>We are sorry that you've decided to leave us. If you have any feedback or suggestions for us, please let us know. You are always welcome back at any time.</p>
	       <p style='color: darkgrey;'>Thank you for the time you spent with us. Good luck with your future endeavours!</p>
	   </body>
	</html>
`
/*
* Google recommends generating an application-specific password.
* An application-specific password is a password that you can use for applications to access your
* Google account when the application doesn't support logging in using a one-time password.
* */
const service = 'gmail'

const sendEmail = async (to, subject, htmlContent) => {
	// create reusable transporter object using the default SMTP transport
	let transporter = nodemailer.createTransport({
		service,  //Replace with your email service
		// This credentials will be used for logging into sender's email account
		auth: {
			user: process.env.SENDER_EMAIL, //Replace with your email
			pass: process.env.SENDER_PASSWORD //Replace with your email password
		}
	});

	let mailOptions = {
		from: process.env.SENDER_EMAIL, // sender address
		to: to, // list of receivers
		subject: subject, // Subject line
		html: htmlContent // html body
	};

	// send mail with defined transport object
	let info = await transporter.sendMail(mailOptions);

	console.log("Message sent: %s", info.messageId);
}

// Call function with the email details.
// sendEmail(
// 		'receiver@example.com',
// 		'Hello World',
// );

module.exports = {
	sendEmail,
	welcomeHTMLContent,
	bbHTMLContent
}