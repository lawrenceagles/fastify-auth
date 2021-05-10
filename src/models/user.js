import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = mongoose.Schema({
	username: {
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
// Hash the plain text password before saving
userSchema.pre('save', async function(next) {
	const user = this;
	if (user.isModified('password')) {
		user.password = await bcrypt.hash(user.password, 8);
	}

	next();
});

userSchema.methods.generateToken = async function() {
	let user = this;

	const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '72h' });

	user.tokens = user.tokens.concat({ token });
	await user.save();

	return token;
};

// create a custom model method to find user by token for authenticationn
userSchema.statics.findByToken = function(token) {
	let User = this;
	let decoded;

	try {
		if (!token) {
			return new Error('Missing token header');
		}

		decoded = jwt.verify(token, process.env.JWT_SECRET);
	} catch (error) {
		return error;
	}
	return User.findOne({
		_id: decoded._id,
		'tokens.token': token
	});
};

// create a new mongoose method for user login authenticationn
userSchema.statics.findByCredentials = async (username, password) => {
	try {
		if (!username || !password) {
			return new Error('One or more required field missing');
		}

		const loggedInUser = await User.findOne({ username });

		if (!loggedInUser) {
			throw new Error('Email does not exist');
		}

		const isMatch = bcrypt.compareSync(password, user.password);
		if (!isMatch) {
			throw new Error('Error Wrong Password');
		}

		return loggedInUser;
	} catch (error) {
		return error;
	}
};

userSchema.methods.removeToken = function(token) {
	let user = this;
	return user.updateOne({
		$pull: {
			tokens: {
				token
			}
		}
	});
};

const User = mongoose.model('user', userSchema);
export default User;
