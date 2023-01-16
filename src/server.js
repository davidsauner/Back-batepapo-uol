const PORT = 5000
import dotenv from "dotenv"
import express from 'express'
dotenv.config()
const app = express()
app.use(express.json())













app.listen(PORT, () => {
    console.log(`Server iniciado na porta ${PORT}`)
  })