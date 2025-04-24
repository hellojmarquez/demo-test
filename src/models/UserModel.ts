import { IUser } from "@/types";
import mongoose from "mongoose";

if (mongoose.models.User) {
  delete mongoose.models.User;
}

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  picture: {
    type: String,
    default: "/avatar.png",
  },
  subaccounts: {
    type: Array,
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  lastConnection: {
    type: Date,
    default: Date.now,
  },
  lastConnectionIP: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    default: "user",
  },
  status: {
    type: String,
    default: "active",
  },
  permissions: {
    type: Array,
    default: [],
  },
  artists: {
    type: Array,
    default: [],
  },
});

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
