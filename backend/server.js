import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())

// Endpoint: /api/users
app.get('/api/users', (req, res) => {
  try {
    const dbPath = path.join(__dirname, 'db.json') // ⬅️ يتأكد أنه يقرا من ./db.json
    const rawData = fs.readFileSync(dbPath, 'utf-8')
    const data = JSON.parse(rawData)
    const users = data.users || []
    res.json(users)
  } catch (err) {
    console.error('❌ Error reading db.json:', err)
    res.status(500).json({ error: 'Failed to load data from db.json' })
  }
})

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
})
