import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { MCPClient } from './index-mcp.js'
import { json } from "./db/db.js";
import * as fs from 'fs';

dotenv.config();
const app = express()
const port = 3000;

app.use(express.json());

const mcp = new MCPClient();

const link = './db/db.json';

const { systemInstruction } = json;

app.get('/', async (req:Request, res:Response) =>  {

  res.json({ data: 'app' }).status(200);
})

app.post('/message', async (req:Request, res:Response) =>  {

  const response = await mcp.processQuery(req.body.text);

  res.jsonp(response).status(200);

})

app.post('/config', async (req:Request, res:Response) =>  {

  const response = req.body.data;

  fs.writeFile(link, JSON.stringify(req.body.data), { flag: 'w+', encoding: 'utf8' }, async (err) => {

    if(!err) {
      if(response.systemInstruction) {
        await mcp.connectToServer(process.argv[2], systemInstruction);
        res.json(response).status(200);
      } else {
        await mcp.connectToServer(process.argv[2], '');
        res.json(response).status(200);
      }
    } else {
      res.json({
        error: err
      }).status(500);
    }

  });

});

app.get('/config', async (req:Request, res:Response) =>  {

  console.log('entre');

  if (fs.existsSync(link)) {
    fs.readFile(link, (err, data) => {
      if (!err && data) {
        res.jsonp(JSON.parse(data.toString())).status(200);
      } else {
        res.json({ data: err }).status(500);
      }
    })
  }

});

app.listen(port, async () => { 
  console.log("Server running at PORT: ", port); 
  await mcp.connectToServer(process.argv[2],systemInstruction );
}).on("error", (error) => {
  // gracefully handle error
  throw new Error(error.message);
});