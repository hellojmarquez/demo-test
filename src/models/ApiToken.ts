const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

const ApiToken = mongoose.models.ApiToken || mongoose.model("ApiToken", tokenSchema);


export default ApiToken;
