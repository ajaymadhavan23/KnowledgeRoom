import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('mern_crud');
    const users = await db.collection('users').find({}).toArray();
    console.log("USERS_COUNT:", users.length);
    console.log("USERS:", users.map(u => u.email));
  } finally {
    await client.close();
  }
}
run().catch(console.error);
