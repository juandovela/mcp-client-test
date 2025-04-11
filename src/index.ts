import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { MCPClient } from './index-mcp.js'
import { ConverToZOD, GetOnlyQuestions } from './utils/ConvertToZOD.js'

dotenv.config();
const app = express()
const port = 3000;

app.use(express.json());

const mcp = new MCPClient();

await mcp.connectToServer(process.argv[2]);

app.get('/', async (req:Request, res:Response) =>  {

  const getData = GetOnlyQuestions();

  res.send('App')
})

app.post('/message', async (req:Request, res:Response) =>  {

  const response = await mcp.processQuery(req.body.text);

  res.jsonp(response)

})

app.listen(port, () => { 
  console.log("Server running at PORT: ", port); 
}).on("error", (error) => {
  // gracefully handle error
  throw new Error(error.message);
});