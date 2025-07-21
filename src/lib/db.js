import clientPromise from './mongodb'

export async function getUsers() {
  const client = await clientPromise
  const db = client.db()  // uses default DB from URI or specify like client.db('mydb')
  const users = await db.collection('users').find({}).toArray()
  return users
}
