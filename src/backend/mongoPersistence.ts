import { MongoClient, type Collection } from 'mongodb';
import type { GameState } from '../shared/types.js';

const DB_NAME = 'LiarsDeck';
const COLLECTION = 'gameRooms';

type RoomDoc = { _id: string; gameState: GameState; updatedAt: Date };

let client: MongoClient | null = null;
let roomsCollection: Collection<RoomDoc> | null = null;

export function isMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI?.trim());
}

export function isMongoPersistenceEnabled(): boolean {
  return roomsCollection !== null;
}

export async function connectMongo(): Promise<boolean> {
  if (!isMongoConfigured()) {
    console.log('[mongo] MONGODB_URI not set; room persistence disabled');
    return false;
  }
  try {
    client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    roomsCollection = client.db(DB_NAME).collection<RoomDoc>(COLLECTION);
    console.log('[mongo] connected');
    return true;
  } catch (err) {
    console.error('[mongo] connect failed', err);
    client = null;
    roomsCollection = null;
    return false;
  }
}

/** Fire-and-forget upsert of full in-memory game state (includes private hands). */
export function persistRoomSnapshot(roomName: string, gameState: GameState): void {
  if (!roomsCollection) return;
  void roomsCollection
    .updateOne(
      { _id: roomName },
      { $set: { _id: roomName, gameState, updatedAt: new Date() } },
      { upsert: true }
    )
    .catch((err) => console.error('[mongo] persist failed', roomName, err));
}

export function deleteRoomSnapshot(roomName: string): void {
  if (!roomsCollection) return;
  void roomsCollection.deleteOne({ _id: roomName }).catch((err) => {
    console.error('[mongo] delete failed', roomName, err);
  });
}

export async function loadRoomSnapshots(): Promise<Record<string, GameState>> {
  if (!roomsCollection) return {};
  const out: Record<string, GameState> = {};
  const cursor = roomsCollection.find({});
  for await (const doc of cursor) {
    if (doc.gameState) {
      out[doc._id] = doc.gameState;
    }
  }
  return out;
}

export async function closeMongo(): Promise<void> {
  if (client) {
    await client.close().catch(() => {});
    client = null;
    roomsCollection = null;
  }
}
