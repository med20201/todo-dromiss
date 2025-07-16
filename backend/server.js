import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const uri = process.env.MONGODB_URI
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err))

app.get('/', (req, res) => res.send('API is running'))

// Example route
app.get('/api/users', async (req, res) => {
  const users = await mongoose.connection.db.collection('users').find().toArray()
  res.json(users)
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
