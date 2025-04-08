import { Chat, GenerateContentResponse, GoogleGenAI } from "@google/genai";
import express, { Request, Response } from "express";
import { MCPClient } from './src/MCPClient.js'
import dotenv from "dotenv";

dotenv.config();
const app = express()
const port = 3000;



const mcpClient = new MCPClient();
mcpClient.connectToServer(process.argv[2]);

const tools = mcpClient.getTools();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

let chat:Chat | undefined;


app.get('/', async (req:Request, res:Response) =>  {

  const finalText = [];
  const toolResults = [];

  if(chat) {
    const response1 = await chat.sendMessage({
      message: "Me llamo Juan",
      config: {
        systemInstruction: "Con la ayuda de la tool star-recommendation-flow brindada, necesito que me vayas guiando con las preguntas para poder encontrar un hogar, haz una pregunta a la vez",
        tools: [
          {
            functionDeclarations: [mcpClient.getTools()]
          }
        ],
      }
    });

    // Check for a function call
    if (response1?.candidates?.[0]?.content?.parts?.[0]?.functionCall) {
      const functionCall = response1.candidates[0].content.parts[0].functionCall;
      console.log('Function Call:', functionCall);

      // Call the MCP server with the predicted tool
      // writeLine(serverStdin, JSON.stringify({
      //   method: 'call_tool',
      //   tool_name: functionCall.name,
      //   arguments: functionCall.args,
      // }));
      const result = await mcpClient.getCallTool(functionCall.name ? functionCall.name: 'star-recommendation-flow', functionCall.args);
      toolResults.push(JSON.stringify(result));

      // const toolResultResponse = await readLine(serverStdout);
      // console.log('Tool Result Response:', toolResultResponse);
      // const toolResultData = JSON.parse(toolResultResponse);

      // if (toolResultData?.status === 'ok' && toolResultData?.content?.[0]?.text) {
      //   console.log('Tool Result:', toolResultData.content[0].text);
      //   // Continue to create a user-friendly response based on the tool result
      // } else {
      //   console.error('Error calling tool:', toolResultData?.error);
      // }

      res.jsonp(response1);
    } else if (response1?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.log('No function call found in the response.');
      console.log('Response Text:', response1.candidates[0].content.parts[0].text);
      res.jsonp(response1);
    } else {
      console.log('No content in the response.');
      res.send('error!')
    }


    // const response2 = await chat.sendMessage({
    //   message: "Mi nombre es Juan",
    //   config: {
    //     tools: [
    //       {
    //         functionDeclarations: [mcpClient.getTools()]
    //       }
    //     ],
    //   }
    // });

    // console.log('response2', response2);

    // res.jsonp(response2);


  } else {
    res.send('error!')
  }
})

async function main() {
  chat = ai.chats.create({
    model: "gemini-2.0-flash",
    config: {
      systemInstruction: "Con la ayuda de la tool star-recommendation-flow brindada, necesito que me vayas guiando con las preguntas para poder encontrar un hogar, haz una pregunta a la vez",
      tools: [
        {
          functionDeclarations:  [mcpClient.getTools()]
        }
      ],
    },
    history: [
      {
        role: "user",
        parts: [{ text: "Hola" }],
      },
      {
        role: "model",
        parts: [{ text: "Un gusto conocerte, cual es tu nombre?" }],
      },
    ],
  });

}

await main();

app.listen(port, () => { 
  console.log("Server running at PORT: ", port); 
}).on("error", (error) => {
  // gracefully handle error
  throw new Error(error.message);
});