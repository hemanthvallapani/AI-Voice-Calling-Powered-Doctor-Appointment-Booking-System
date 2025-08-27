const { Client, Databases, Users, Messaging, Storage } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT)
  .setProject(process.env.PROJECT_ID)
  .setKey(process.env.API_KEY);

const databases = new Databases(client);
const users = new Users(client);
const messaging = new Messaging(client);
const storage = new Storage(client);

module.exports = {
  client,
  databases,
  users,
  messaging,
  storage,
  DATABASE_ID: process.env.DATABASE_ID,
  PATIENT_COLLECTION_ID: process.env.PATIENT_COLLECTION_ID,
  DOCTOR_COLLECTION_ID: process.env.DOCTOR_COLLECTION_ID,
  APPOINTMENT_COLLECTION_ID: process.env.APPOINTMENT_COLLECTION_ID,
};
