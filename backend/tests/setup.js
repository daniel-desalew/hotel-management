import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

import mongoose from "mongoose";
import { beforeAll, afterAll, afterEach, jest } from "@jest/globals";

// Extend Jest timeout (MongoDB connect can be slow)
jest.setTimeout(30000);

beforeAll(async () => {
  const uri =
    process.env.MONGO_URI_TEST ||
    "mongodb://localhost:27017/hotel_management_test";
  await mongoose.connect(uri);
  console.log("✅ Test DB connected");
});

afterEach(async () => {
  // Clean all collections after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  console.log("🛑 Test DB closed");
});
