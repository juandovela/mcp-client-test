import express, { Request, Response } from "express";
import dotenv from "dotenv";
// import { MCPClient } from './utils/index-mcp.js'
import { MCPClientGemini } from './utils/index-google.js'
// import { MCPClientDeepSeek } from './utils/index-deepseek.js';
// import { MCPClientChatGPT } from './utils/index-chatgpt.js';
import * as fs from 'fs';
import cors from 'cors';

dotenv.config();
const app = express()
const port = 3000;

app.use(express.json());
app.use(cors());

// const mcp = new MCPClient();
const mcpGemini = new MCPClientGemini();
// const mcpDS = new MCPClientDeepSeek();
// const mcpGPT = new MCPClientChatGPT();

app.get('/', async (req:Request, res:Response) =>  {

  res.json({ data: 'app' }).status(200);

})

app.post('/init', async (req:Request, res:Response) =>  {

  // const response = await mcp.initChat(req.body.text);

  // res.jsonp(response).status(200);

});

app.post('/message', async (req:Request, res:Response) =>  {

  // const response = await mcp.processQuery(req.body.text);

  res.jsonp({response: ''}).status(200);

});

app.post('/message-gemini', async (req:Request, res:Response) =>  {

  const { prompt, history } = req.body;
  console.log(prompt, history);
  const response = await mcpGemini.queryAI(prompt, history);

  res.jsonp(response).status(200);

});

app.post('/message-gemini-history', async (req:Request, res:Response) =>  {

  const response = await mcpGemini.queryAIHistory();

  res.jsonp(response).status(200);

});

app.post('/message-gemini-iframe', async (req:Request, res:Response) =>  {


  const { prompt, history } = req.body;
  console.log(prompt, history);
  const response = await mcpGemini.queryAIIFrame(prompt, history);

  res.jsonp(response).status(200);

});

app.post('/message-deepseek', async (req:Request, res:Response) =>  {

  // const response = await mcpDS.queryAI(req.body.text);

  // res.jsonp(response).status(200);

});

app.post('/message-chatgpt', async (req:Request, res:Response) =>  {

  // const response = await mcpGPT.queryAI(req.body.text);

  // res.jsonp(response).status(200);

});

app.listen(port, async () => { 
  console.log("Server running at PORT: ", port);
  // const systemInstruction = 'Con la ayuda de la tool star-recommendation-flow brindada, necesito que me vayas guiando con las preguntas para poder encontrar un hogar, haz una pregunta a la vez. Luego usa la tool para mandar llamar la api de algolia';
  // const systemInstruction = 'Con la información proporcionada, necesito que me vayas guiando paso a paso con los puntos que hay en la tool, cada uno tiene un hotspot y multiples materiales a cambiar, ve guiándolo uno por uno, la estuctura tiene un estado para que le pongas en la llave "value", el estado "visited" si ya fue visitado o visit si es el punto a visitar, una vez que el usuario eliga material, puedes marcarlo como visitado y añadirle al siguiente visit';
  const systemInstruction = 'With provided information, guide step by step through the points in the tool. Guide one by one.';
  // await mcpGPT.initChat(systemInstruction );
  await mcpGemini.initChat(systemInstruction );
  // await mcp.connectToServer(process.argv[2],systemInstruction );
}).on("error", (error) => {
  // gracefully handle error
  throw new Error(error.message);
});