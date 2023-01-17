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
const colectionparticipants
 = db.collection("participants");
const colectionmessages = db.collection("messages");

app.post("/participants", async (req, res) => {
  const { name } = req.body;
  const { error } = participantsValidation.validate(
    { name },
    { abortEarly: false }
  );
  if (error) {
    return res.status(422).send("erro na validação do usuario");
  }

  try {
    const participantislogin = await colectionparticipants
    .findOne({ name });
    if (participantislogin) {
      return res.status(409).send("nome de usuario ja cadastrado!");
    }
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }

  await colectionparticipants
  .insertOne({ name, lastStatus: Date.now() });

  await colectionmessages.insertOne({
    from: name,
    to: "Todos",
    text: "entra na sala...",
    type: "status",
    time: dayjs().format("HH:mm:ss"),
  });
  res.sendStatus(201);
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
  const userlogin = await colectionparticipants
    .findOne({name: user,})
  try {
    if(!userlogin) return res.sendStatus(422)
    
    const { error } = messagesValidation.validate(message, {
      abortEarly: false,
    });
    if (error) {
      return res.status(422).send("erro na mensagem");
    }

    await colectionmessages.insertOne(message);
  } catch (err) {
    console.log(err);
    res.sendStatus(500)
  }
  res.sendStatus(201)
});
app.post("/status", async (req, res) => {
  const {user} = req.headers;
  try {
    const userlogin = await colectionparticipants
    .findOne({name: user,})

    if (!userlogin){
      return res.sendStatus(404);
    }
    await colectionparticipants
    .updateOne({name: user},
      {$set:{lastStatus:Date.now() }})
      res.sendStatus(200)
  }catch(err) {}

});
app.get("/participants", async (req, res) => {
  try {
    const participants = await colectionparticipants
    .find().toArray();
    res.send(participants);
  } catch (err) {
    res.status(500).send("erro ao enviar os usuarios", err);
  }
});
// app.get("/messages", async (req, res) => {
// const {user} = req.headers;
// const limit = req.query.limit;


// if (isNaN(limit) && limit || parseInt(limit) <= 0) return res.sendStatus(422)



// try{
//   const messsages = await colectionmessages.find(
//     {$or: [
//       { from: user},
//       { to: {$in: [user,"Todos"]}},
//       {type: "message"},
//     ],}
//   ).limit(Number(limit)).toArray();


//   res.send(messsages)
// }catch(err){
//   res.status(500).send("erro ao receber mensagem")
// }


// });
app.get("/messages", async (req, res) => {
  const { user } = req.headers
  const limit = req.query.limit

 

  try {
    // if (isNaN(limit) && limit || parseInt(limit) <= 0) return res.sendStatus(422)
    // .limit(Number(limit))
    const messages = await db.collection("messages").find({
      $or: [
        { from: user },
        { to: { $in: [user, "Todos"] } },
        { type: "message" }
      ]
    }).toArray()

    res.send(messages)

  } catch (error) {
    console.error(error)
    res.status(500).send("Zicou bonito o servidor!!")
  }
})





setInterval(async ()=>{
console.log("inteval")
const dateafktime = Date.now() - 10000

try{
const afkusers = await colectionparticipants
.find({lastStatus: {$lte: dateafktime}}).toArray();

if (afkusers){
  const arrayuserafk = afkusers.map((u)=>{
     return{
      from: u.name,
      to: "Todos",
      text: "sai da sala...",
      type: "status",
      time: dayjs().format("HH:mm:ss"),
     } 


  })
  await colectionmessages.insertMany(arrayuserafk)
  await colectionparticipants.deleteMany({lastStatus: {$lte: dateafktime}})

}




}catch(err){
  console.log("erro na remoção dos usuarios afk")
}

}, 15000)


app.listen(PORT, () => {
  console.log(`Server iniciado na porta ${PORT}`);
});
