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
user.pre('save', function(next) {
	const user = this; // bind this

	if (user.isModified('password')) {
		try {
			const salt = bcrypt.genSaltSync(12);
			const hash = bcrypt.hashSync(user.password, salt);
			user.password = hash;
			next();
		} catch (error) {
			return next(error);
		}
	} else {
		return next();
	}
});

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

// create a custom model method to find user by token for authenticationn
user.statics.findByToken = function(token) {
	let User = this;
	let decoded;

	try {
		if (!token) {
			return new Error('Missing token header');
		}
		decoded = jwt.verify(token, 'sssssdfgg');
	} catch (error) {
		return error;
	}
	return User.findOne({
		_id: decoded._id,
		'tokens.token': token
	});
};

// create a new mongoose method for user login authenticationn
user.statics.findByCredentials = async function(email, password) {
	let User = this;
	try {
		if (!email || !password) {
			return new Error('One or more required field missing');
		}
		const loggedInUser = await User.findOne({ email });
		// find user by email
		if (!loggedInUser) {
			// handle user not found
			throw new Error('Email does not exist');
		}

		const passwordValidation = bcrypt.compareSync(password, user.password);
		if (passwordValidation === true) {
			return loggedInUser;
		} else {
			throw new Error('Error Wrong Password');
		}
	} catch (error) {
		return error;
	}
};

user.methods.removeToken = function(token) {
	let user = this;
	return user.updateOne({
		$pull: {
			tokens: {
				token
			}
		}
	});
};

const User = mongoose.model('user', user);
export default User;
