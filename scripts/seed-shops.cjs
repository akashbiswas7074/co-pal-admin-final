const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env from the root or local
dotenv.config({ path: path.join(__dirname, '../.env') });

const ShopSchema = new mongoose.Schema({
  name: String,
  address: String,
  phoneNumber: String,
  googleMapLink: String,
  latitude: Number,
  longitude: Number,
  isActive: Boolean,
}, { timestamps: true });

const Shop = mongoose.models.Shop || mongoose.model('Shop', ShopSchema);

const demoShops = [
  {
    name: "VibeCart Mumbai - Flagship Store",
    address: "123, Linking Road, Bandra West, Mumbai, Maharashtra 400050",
    phoneNumber: "+91 22 2640 1234",
    googleMapLink: "https://maps.app.goo.gl/Mumbai",
    latitude: 19.0596,
    longitude: 72.8295,
    isActive: true
  },
  {
    name: "VibeCart Delhi - Select Citywalk",
    address: "A-3, District Centre, Saket, New Delhi, Delhi 110017",
    phoneNumber: "+91 11 4265 8290",
    googleMapLink: "https://maps.app.goo.gl/Delhi",
    latitude: 28.5284,
    longitude: 77.2185,
    isActive: true
  },
  {
    name: "VibeCart Bangalore - Indiranagar",
    address: "100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038",
    phoneNumber: "+91 80 4123 5678",
    googleMapLink: "https://maps.app.goo.gl/Bangalore",
    latitude: 12.9716,
    longitude: 77.6412,
    isActive: true
  },
  {
    name: "VibeCart Kolkata - Park Street",
    address: "Ground Floor, 15 Park St, Kolkata, West Bengal 700016",
    phoneNumber: "+91 33 2265 1122",
    googleMapLink: "https://maps.app.goo.gl/Kolkata",
    latitude: 22.5539,
    longitude: 88.3506,
    isActive: true
  }
];

async function seedShops() {
  try {
    const mongoUri = process.env.MONGODB_URL;
    if (!mongoUri) throw new Error("MONGODB_URI not found in environment");

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Check existing
    const count = await Shop.countDocuments();
    if (count > 0) {
      console.log(`Found ${count} existing shops. Skipping seed.`);
      process.exit(0);
    }

    await Shop.insertMany(demoShops);
    console.log("Successfully seeded 4 demo shops!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seedShops();
