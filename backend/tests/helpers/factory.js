import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import User from "../../src/models/User.js";
import Hotel from "../../src/models/Hotel.js";
import RoomType from "../../src/models/RoomType.js";
import Room from "../../src/models/Room.js";
import Guest from "../../src/models/Guest.js";

/**
 * Create a user (with hashed password)
 */
export const createUser = async (overrides = {}) => {
  const password = overrides.password || "Password123";
  const user = await User.create({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email().toLowerCase(),
    phone: faker.phone.number("##########"),
    password,
    role: "hotel_admin",
    isEmailVerified: true,
    ...overrides,
  });
  return { user, plainPassword: password };
};

/**
 * Create a hotel
 */
export const createHotel = async (overrides = {}) => {
  return Hotel.create({
    name: faker.company.name() + " Hotel",
    code: faker.string.alphanumeric(6).toUpperCase(),
    category: "4_star",
    type: "hotel",
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      country: faker.location.country(),
    },
    contact: {
      phone: faker.phone.number(),
      email: faker.internet.email(),
    },
    taxRate: 10,
    currency: "USD",
    ...overrides,
  });
};

/**
 * Create a room type
 */
export const createRoomType = async (hotelId, overrides = {}) => {
  return RoomType.create({
    hotelId,
    name: faker.helpers.arrayElement([
      "Deluxe",
      "Standard",
      "Suite",
      "Executive",
    ]),
    code: faker.string.alphanumeric(4).toUpperCase(),
    maxOccupancy: 2,
    maxAdults: 2,
    maxChildren: 0,
    basePrice: faker.number.int({ min: 50, max: 500 }),
    totalRooms: 10,
    ...overrides,
  });
};

/**
 * Create a room
 */
export const createRoom = async (hotelId, roomTypeId, overrides = {}) => {
  return Room.create({
    hotelId,
    roomNumber: faker.string.numeric(3),
    floor: faker.number.int({ min: 1, max: 10 }),
    roomTypeId,
    status: "available",
    housekeepingStatus: "clean",
    ...overrides,
  });
};

/**
 * Create a guest
 */
export const createGuest = async (overrides = {}) => {
  return Guest.create({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email().toLowerCase(),
    phone: faker.phone.number("##########"),
    ...overrides,
  });
};

/**
 * Create a complete hotel setup (hotel + room type + rooms)
 */
export const createHotelWithRooms = async (roomCount = 5) => {
  const hotel = await createHotel();
  const roomType = await createRoomType(hotel._id);

  const rooms = await Promise.all(
    Array.from({ length: roomCount }).map((_, i) =>
      createRoom(hotel._id, roomType._id, { roomNumber: String(101 + i) }),
    ),
  );

  return { hotel, roomType, rooms };
};

/**
 * Generate a valid JWT for testing
 */
export const getAuthToken = (user) => {
  return user.generateAccessToken();
};

/**
 * Prepare auth header
 */
export const authHeader = (token) => ({ Authorization: `Bearer ${token}` });
