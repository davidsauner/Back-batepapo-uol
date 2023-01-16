const PORT = 5000;
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import joi from "joi";
import dayjs from "dayjs";
import { MongoClient } from "mongodb";
dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const mongoClient = new MongoClient(process.env.DATABASE_URL);
const participantsValidation = joi.object({
  name: joi.string().required().min(3),
});
const messagesValidation = joi.object({
  from: joi.string().required(),
  to: joi.string().required().min(3),
  text: joi.string().required().min(1),
  type: joi.string().required().valid("message", "private_message"),
  time: joi.string(),
});
try {
  await mongoClient.connect();
  console.log("mongo conectou");
} catch (err) {}

const db = mongoClient.db("batepapouol");
const colectionpaticipants = db.collection("participants");
const colectionmessages = db.collection("messages");

app.post("/participants", async (req, res) => {
  const { name } = req.body;
  const { error } = participantsValidation.validate(
    { name },
    { abortEarly: false }
  );
  if (error) {
    return res.status(402).send("erro na validação do usuario");
  }

  try {
    const participantislogin = await colectionpaticipants.findOne({ name });
    if (participantislogin) {
      return res.status(409).send("nome de usuario ja cadastrado!");
    }
  } catch (err) {
    console.log("erro na verificação do usuario...", err);
    res.sendStatus(509);
  }

  await colectionpaticipants.insertOne({ name, lastStatus: Date.now() });

  await colectionmessages.insertOne({
    from: name,
    to: "Todos",
    text: "entrou na sala",
    type: "status",
    time: dayjs().format("HH:mm:ss"),
  });
  res.status(202).send("Usuario criado");
});
app.post("/messages", async (req, res) => {
  const { to, text, type } = req.body;
  const { user } = req.headers;
  const message = {
    from: user,
    to,
    text,
    type,
    time: dayjs().format("HH:mm:ss"),
  };

  try {
    const { error } = messagesValidation.validate(message, {
      abortEarly: false,
    });
    if (error) {
      return res.status(402).send("erro na na mensagem");
    }

    await colectionmessages.insertOne(message);
  } catch (err) {
    res.status(500).send("erro post message");
  }
  res.status(201).send("mensagem enviada");
});
app.post("/status", async (req, res) => {
  const {user} = req.headers;
  try {
    const userlogin = await colectionpaticipants.findOne({name: user,})

    if (!userlogin){
      return res.send("usuario desconectado")
    }
    await colectionpaticipants.updateOne({name: user},
      {$set:{lastStatus:Date.now() }})
      res.status(200).send("usuario atualizado")
  }catch(err) {}

});
app.get("/participants", async (req, res) => {
  try {
    const participants = await colectionpaticipants.find().toArray();
    res.send(participants);
  } catch (err) {
    res.status(500).send("erro ao enviar os usuarios", err);
  }
});
app.get("/messages", async (req, res) => {
const {user} = req.headers;

try{
  const messsages = await colectionmessages.find(
    {$or: [
      { from: user},
      { to: {$in: [user,"Todos"]}},
      {type: "message"},
    ],}
  ).toArray();


  res.send(messsages)
}catch(err){
  res.status(500).send("erro ao receber mensagem")
}


});

const timeafk = 10000
setInterval(async ()=>{
  console.log("interval")
  const timenow = Date.now()
  const newtimeafk = timenow - timeafk
  try{
    const usersafk = await colectionpaticipants.find({lastStatus: newtimeafk}).toArray( )

  }catch(err){
    res.status(500).send("erro ao remover usuarios afk")
  }

},15000)






app.listen(PORT, () => {
  console.log(`Server iniciado na porta ${PORT}`);
});
