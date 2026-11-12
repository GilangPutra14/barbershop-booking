import { MongoClient } from 'mongodb';

// MASUKKAN LINK MONGODB ATLAS ANDA LANGSUNG DI SINI
const uri = "mongodb+srv://boytaxadmin:boytax12345@cluster0.dykme65.mongodb.net/barbershop?retryWrites=true&w=majority";

// const uri = "mongodb+srv://boytaxadmin:ADMINBOYTAX123@cluster0.dykme65.mongodb.net/barbershop?retryWrites=true&w=majority";


const options = {};
let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
