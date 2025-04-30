import mongoose from 'mongoose';

const contributorSchema = new mongoose.Schema(
	{
		id: {
			type: Number,
			required: true,
			unique: true,
		},
		name: {
			type: String,
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

// Check if the model already exists to prevent overwriting
const Contributor =
	mongoose.models.Contributor ||
	mongoose.model('Contributor', contributorSchema);

export default Contributor;
