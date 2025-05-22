import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
	content: {
		type: String,
		required: true,
	},
	sender: {
		type: String,
		required: true,
	},
	senderRole: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

const ticketSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		status: {
			type: String,
			enum: ['open', 'in-progress', 'closed'],
			default: 'open',
		},
		priority: {
			type: String,
			enum: ['low', 'medium', 'high'],
			default: 'medium',
		},
		userId: {
			type: String,
			required: true,
		},
		assignedTo: {
			type: String,
			required: true,
		},
		createdBy: {
			type: String,
			required: true,
		},
		updatedBy: {
			type: String,
		},
		messages: [messageSchema],
		createdAt: {
			type: Date,
			default: Date.now,
		},
		updatedAt: {
			type: Date,
		},
	},
	{
		timestamps: true,
	}
);

const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);

export default Ticket;
