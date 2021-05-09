import mongoose from 'mongoose';
const user = mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true
	},
	password: {
		type: String,
		required: true
	},
	tokens: [
		{
			token: {
				type: String,
				required: true
			}
		}
	]
});

// encrypt password using bcrypt conditionally. Only if the user is newly created.
// user.pre('save', function(next) {
// 	const admin = this; // bind this

// 	if (admin.isModified('password')) {
// 		try {
// 			const salt = bcrypt.genSaltSync(12);
// 			const hash = bcrypt.hashSync(admin.password, salt);
// 			admin.password = hash;
// 			next();
// 		} catch (error) {
// 			return next(error);
// 		}
// 	} else {
// 		return next();
// 	}
// });

user.methods.generateToken = function() {
	let user = this;
	let access = 'auth';
	let token = jwt
		.sign({ _id: user._id.toHexString(), access }, process.env.JWT_SECRET, { expiresIn: '72h' })
		.toString(); // the second

	// set the user.tokens empty array of object, object properties with the token and the access generated.
	user.tokens = user.tokens.concat([ { access, token } ]);

	// save the user and return the token to be used in the server.js where with the POST route for assiging tokens to newly signed up users.
	return user.save().then(() => {
		return token;
	});
};

// create a custom model method to find admin by token for authenticationn
user.statics.findByToken = function(token) {
	let Admin = this;
	let decoded;

	try {
		decoded = jwt.verify(token, process.env.JWT_SECRET);
	} catch (e) {
		return Promise.reject();
	}
	return Admin.findOne({
		_id: decoded._id,
		'tokens.token': token,
		'tokens.access': 'auth'
	});
};

// create a new mongoose method for user login authenticationn
user.statics.findByCredentials = function(email, password) {
	let Admin = this;
	return Admin.findOne({ email }).then((admin) => {
		// find admin by email
		if (!admin) {
			// handle admin not found
			return Promise.reject('Email does not exist');
		}
		return new Promise((resolve, reject) => {
			const passwordValidation = bcrypt.compareSync(password, admin.password);
			if (passwordValidation === true) {
				return resolve(admin);
			} else {
				return reject('Error Wrong Password');
			}
		});
	});
};

user.methods.removeToken = function(token) {
	let admin = this;
	return admin.updateOne({
		$pull: {
			tokens: {
				token
			}
		}
	});
};

const User = mongoose.model('user', user);
export default User;
