import mongoose from "mongoose";

// Optional: enable Mongoose debug mode in development
if (process.env.NODE_ENV === "development") {
  mongoose.set("debug", false); // Set to true to see every MongoDB query in console
}

const connectDB = async () => {
  try {
    // Fail fast if MONGO_URI is missing
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env file");
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Modern mongoose (v6+) doesn't need useNewUrlParser / useUnifiedTopology
      serverSelectionTimeoutMS: 10000, // Timeout after 10s
      socketTimeoutMS: 45000, // Close sockets after 45s
      maxPoolSize: 10, // Max 10 concurrent connections
      minPoolSize: 2, // Keep at least 2 warm
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📚 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// ─── Connection event listeners ────────────────────────────────
mongoose.connection.on("connected", () => {
  console.log("🟢 Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error(`🔴 Mongoose connection error: ${err.message}`);
});

mongoose.connection.on("disconnected", () => {
  console.warn("🟡 Mongoose disconnected from MongoDB");
});

mongoose.connection.on("reconnected", () => {
  console.log("🔄 Mongoose reconnected to MongoDB");
});

// ─── Graceful shutdown ─────────────────────────────────────────
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("🛑 Mongoose connection closed (SIGINT)");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await mongoose.connection.close();
  console.log("🛑 Mongoose connection closed (SIGTERM)");
  process.exit(0);
});

export default connectDB;
