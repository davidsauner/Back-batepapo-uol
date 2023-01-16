const PORT = 5000
import dotenv from "dotenv"
import express from 'express'
import cors from "cors";
import joi from 'joi'
import dayjs from 'dayjs'
import {MongoClient} from "mongodb"
dotenv.config()
const app = express()
app.use(express.json())
app.use(cors());

const participantsValidation  = joi.object({
  name : joi.string().required().min(3),

})

const mongoClient = new MongoClient(process.env.DATABASE_URL)
const colectionpaticipants = db.collection("participants")

try{
  await mongoClient.connect()
  console.log("mongo conectou")

}catch(err){

}

const db = mongoClient.db("batepapouol");

app.post("/participants", async (req, res) => {
  const {name} = req.body
  const {error} = participantsValidation({name},{abortEarly:false})
  if (error) {
    return res.status(402).send(error)
  }

  const participantislogin = colectionpaticipants.find((participant) => participant.name === name)
  if(participantislogin){
    return res.status(409).send("nome de usuario ja cadastrado!")
  }

  await colectionpaticipants.insertOne({name})

})
app.post("/messages", async (req, res) => {})
app.post("/status", async (req, res) => {})
app.get("/participants", async (req, res) => {})
app.get("/messages", async (req, res) => {})



app.listen(PORT, () => {
    console.log(`Server iniciado na porta ${PORT}`)
  })