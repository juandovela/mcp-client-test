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

app.get('/', async (req: Request, res: Response) => {

  res.json({ data: 'app' }).status(200);

})

app.post('/data-json', async (req: Request, res: Response) => {
  const { data } = req.body;
  console.log(data);
  res.json({ data: 'data-json' }).status(200);
})


app.post('/message-gemini-iframe', async (req: Request, res: Response) => {


  const { prompt, history, flowType } = req.body;
  console.log(prompt, history, flowType);
  const response = await mcpGemini.queryAIIFrame(prompt, history, flowType);

  res.jsonp(response).status(200);

});



app.listen(port, async () => {
  console.log("Server running at PORT: ", port);
  const systemInstruction = 'With provided information, guide step by step through the points in the tool. Guide one by one.';
  // await mcpGPT.initChat(systemInstruction );
  await mcpGemini.initChat(systemInstruction);
  // await mcp.connectToServer(process.argv[2],systemInstruction );
}).on("error", (error) => {
  // gracefully handle error
  throw new Error(error.message);
});