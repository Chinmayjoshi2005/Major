import { MongoClient, type Db } from "mongodb";

const globalForMongo = globalThis as unknown as {
  mongoClientPromise: Promise<MongoClient> | undefined;
  mongoDb: Db | undefined;
};

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined");
  }
  return uri;
}

export async function getMongoClient(): Promise<MongoClient> {
  if (!globalForMongo.mongoClientPromise) {
    console.log("Initializing new MongoClient connection pool...");
    const client = new MongoClient(getMongoUri(), {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    client.on("topologyClosed", () => {
      console.warn("MongoDB topology closed. Resetting cached connection pool.");
      globalForMongo.mongoClientPromise = undefined;
      globalForMongo.mongoDb = undefined;
    });

    const promise = client.connect().catch((err) => {
      console.error("Failed to connect to MongoDB. Resetting cache.", err);
      globalForMongo.mongoClientPromise = undefined;
      globalForMongo.mongoDb = undefined;
      throw err;
    });

    globalForMongo.mongoClientPromise = promise;
  }

  return globalForMongo.mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  if (!globalForMongo.mongoDb) {
    const client = await getMongoClient();
    globalForMongo.mongoDb = client.db("campusguide");
  }
  return globalForMongo.mongoDb;
}

export const COLLECTIONS = {
  users: "users",
  buildings: "buildings",
  floors: "floors",
  rooms: "rooms",
  departments: "departments",
  faculty: "faculty",
  timetables: "timetables",
  navigationNodes: "navigation_nodes",
  navigationEdges: "navigation_edges",
  notices: "notices",
  documents: "documents",
  auditLogs: "audit_logs",
  analyticsEvents: "analytics_events",
} as const;
