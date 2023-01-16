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



const mongoClient = new MongoClient(process.env.DATABASE_URL)
const participantsValidation  = joi.object({
  name : joi.string().required().min(3),

})

try{
  await mongoClient.connect()
  console.log("mongo conectou")

}catch(err){

}

const db = mongoClient.db("batepapouol");
const colectionpaticipants = db.collection("participants")
const colectionmessages = db.collection("messages")

app.post("/participants", async (req, res) => {
  const {name} = req.body
  const {error} = participantsValidation.validate({name},{abortEarly:false})
  if (error) {
    return res.status(402).send(error)
  }

  try{
    const participantislogin = await colectionpaticipants.findOne({name})
  if(participantislogin){
    return res.status(409).send("nome de usuario ja cadastrado!")
  

  }
  }catch(err){
    console.log("erro na verificação do usuario...",err)
    res.sendStatus(509)
  }
  

  await colectionpaticipants.insertOne({name , lastStatus: Date.now()})

  await colectionmessages.insertOne({
        from: name,
        to: "Todos",
        text:"entrou na sala",
        type:"status",
        time: dayjs().format("HH:mm:ss"),
  })
res.status(202).send("Usuario criado")
})
app.post("/messages", async (req, res) => {

})
app.post("/status", async (req, res) => {})
app.get("/participants", async (req, res) => {})
app.get("/messages", async (req, res) => {})



app.listen(PORT, () => {
    console.log(`Server iniciado na porta ${PORT}`)
  })