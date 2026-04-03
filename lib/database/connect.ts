import mongoose, { Mongoose } from "mongoose";

import "./models";

interface MongooseConnection {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

let cached: MongooseConnection = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = {
    conn: null,
    promise: null,
  };
}

export const connectToDatabase = async () => {
  const MONGODB_URL = process.env.MONGODB_URL;
  console.log("Connecting to database with URL:", MONGODB_URL ? MONGODB_URL.substring(0, 30) + "..." : "undefined");
  try {
    if (cached.conn) return cached.conn;
    if (!MONGODB_URL) throw new Error("Missing MONGODB_URL");

    mongoose.set("strictQuery", false);

    if (!cached.promise) {
      cached.promise = mongoose.connect(MONGODB_URL, {
        dbName: "vibecart",
        bufferCommands: false,
      });
    }

    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null; // Clear broken cached promise
    throw error;
  }
};
