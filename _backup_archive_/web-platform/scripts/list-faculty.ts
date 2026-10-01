import { getDb } from '../src/lib/db/mongodb';

(async () => {
  try {
    const db = await getDb();
    const docs = await db.collection('faculty').find({}).limit(20).toArray();
    console.log(docs.map(d=>({name:d.name, roomNumber:d.roomNumber, department:d.department})).slice(0,20));
  } catch (e) {
    console.error(e);
  }
})();
