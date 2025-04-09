import {Chat, GenerateContentResponse, GoogleGenAI} from "@google/genai";
import express, {Request, Response} from "express";
// import { MCPClient } from './src/MCPClient.js'
import dotenv from "dotenv";
import {MCPClient} from './index-mcp.js'
import cors from 'cors';

dotenv.config();
const app = express()
const port = 3000;

app.use(express.json());

app.use(cors({
    origin: '*', // Your frontend URL
    credentials: true
}));

const mcp = new MCPClient();

await mcp.connectToServer(process.argv[2]);

app.get('/', async (req : Request, res : Response) => {

    // const response = await mcp.processQuery({
    // role: 'user',
    // content: [
    //     {
    //       type: 'text',
    //       text: 'Achudame con la casa, plis'
    //     }
    // ]});

    // res.jsonp(response)

})

app.post('/message', async (req : Request, res : Response) : Promise < void > => {

    try {
        console.log('Request body', req.body);
        const text = req.body.text;

        if (typeof text !== 'string') {
            res.status(400).json({error: 'Text must be a string'});
            return;
        }

        const formattedQuery = {
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: text
                }
            ]
        };

        const response = await mcp.processQuery(formattedQuery);
        res.json(response);
    } catch (error) {
        console.error('Error processing message:', error);
        res.status(500).json({
            error: 'Failed to process message',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }


})

app.listen(port, () => {
    console.log("Server running at PORT: ", port);
}).on("error", (error) => { // gracefully handle error
    throw new Error(error.message);
});
