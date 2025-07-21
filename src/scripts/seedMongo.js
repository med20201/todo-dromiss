import dotenv from 'dotenv'
dotenv.config()

import { MongoClient } from 'mongodb'
import fs from 'fs'
import path from 'path'

async function seed() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('Please add your MongoDB URI to .env.local')
  }

  const client = new MongoClient(uri)

  try {
    await client.connect()
    const db = client.db() // إذا بغيت تعطي اسم قاعدة بيانات: client.db('myDatabase')

    // قرا ملف db.json
    const filePath = path.join(process.cwd(), 'db.json')
    const jsonData = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(jsonData)

    // امسح الداتا القديمة باش تبدا نقية
    for (const collectionName of Object.keys(data)) {
      await db.collection(collectionName).deleteMany({})
    }

    // دخل الداتا الجديدة من db.json
    for (const [collectionName, documents] of Object.entries(data)) {
      if (Array.isArray(documents) && documents.length > 0) {
        await db.collection(collectionName).insertMany(documents)
        console.log(`Inserted ${documents.length} documents into collection "${collectionName}"`)
      }
    }

    console.log('Seeding complete!')
  } catch (err) {
    console.error('Seeding failed:', err)
  } finally {
    await client.close()
  }
}

seed()
