
import dotenv from "dotenv";
import { OpenAI } from 'openai'
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { makeLLMAlgoliaRequest } from './AlgoliaConnect.js'
import { APIPromise } from "openai/core.mjs";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// const ai = new GoogleGenAI({ apiKey: DEEPSEEK_API_KEY });

const client = new OpenAI({
  apiKey: OPENAI_API_KEY
})

// const systemInstruction = 'Please refill data of schema with data gave for user'

const questionMCP = {
  "tools": [
    {
      "name": "start-recommendation-flow",
      "description": "Please refill data of schema with data gave for user",
      "inputSchema": {
        "type": "object",
        "properties": {
          "questionNameJSON": {
            "type": "object",
            "properties": {
              "uid": {
                "type": "string",
                "description": "q01"
              },
              "value": {
                "type": "string",
                "description": "Nombre con el que se identifica el usuario, puede colocar el suyo o preguntar si lo llamamos invitado o amigo"
              },
              "active": {
                "type": "boolean",
                "description": "Si el valor de name está vacio, deja este valor en true, sino cambialo a false"
              },
              "options": {
                "type": "array",
                "items": {
                  "type": "string"
                },
                "description": "Añade al array los string, \"guess\" e \"friend"
              }
            },
            "required": [
              "uid",
              "value",
              "active"
            ],
            "additionalProperties": false,
            "description": "Regresa un json con el uid y el name que ha elegido el usuario"
          },
          "questionLocationJSON": {
            "type": "object",
            "properties": {
              "uid": {
                "type": "string",
                "description": "q02"
              },
              "value": {
                "type": "string",
                "description": "Nombre del lugar donde el usuario busca hogar"
              },
              "active": {
                "type": "boolean",
                "description": "Si el valor de location está vacio, deja este valor en true, sino cambialo a false"
              },
              "options": {
                "type": "array",
                "items": {
                  "type": "string"
                },
                "description": "Añade al array los string, \"Austion\", \"Phoenix\", \"Washington \"Las Vegas\""
              }
            },
            "required": [
              "uid",
              "value",
              "active"
            ],
            "additionalProperties": false,
            "description": "Regresa un json con el uid y el location que ha elegido el usuario"
          },
          "questionBedsJSON": {
            "type": "object",
            "properties": {
              "uid": {
                "type": "string",
                "description": "q03"
              },
              "value": {
                "type": "number",
                "description": "Cantidad de habitaciones que el usuario busca en su nuevo hogar"
              },
              "active": {
                "type": "boolean",
                "description": "Si el valor de bed está vacio o es 0, deja este valor en true, sino cambialo a false"
              },
              "options": {
                "type": "array",
                "items": {
                  "type": "string"
                },
                "description": "Añade al array los string, \"Min-0\" e \"Max-10"
              }
            },
            "required": [
              "uid",
              "value",
              "active"
            ],
            "additionalProperties": false,
            "description": "Regresa un json con el uid y el bed que ha elegido el usuario"
          },
          "questionGarageJSON": {
            "type": "object",
            "properties": {
              "uid": {
                "type": "string",
                "description": "q04"
              },
              "value": {
                "type": "number",
                "description": "Cantidad de garages que el usuario busca en su nuevo hogar"
              },
              "active": {
                "type": "boolean",
                "description": "Si el valor de garage está vacio, deja este valor en true, sino cambialo a false"
              },
              "options": {
                "type": "array",
                "items": {
                  "type": "string"
                },
                "description": "Añade al array los string, \"Min-0\" e \"Max-10"
              }
            },
            "required": [
              "uid",
              "value",
              "active"
            ],
            "additionalProperties": false,
            "description": "Regresa un json con el uid y el garage que ha elegido el usuario"
          }
        },
        "required": [
          "questionNameJSON",
          "questionLocationJSON",
          "questionBedsJSON",
          "questionGarageJSON"
        ],
        "additionalProperties": false,
        "$schema": "http://json-schema.org/draft-07/schema#"
      }
    }
  ]
}

export class MCPClientChatGPT {

  private tools: Tool[] = [];

  private deepSanitizeSchema = (schema: any): any => {
    if (schema === null || typeof schema !== 'object') {
      return schema;
    }
    if (Array.isArray(schema)) {
      return schema.map(item => this.deepSanitizeSchema(item));
    }
    const sanitizedObject: { [key: string]: any } = {};
    for (const key in schema) {
      if (key === '$schema' || key === 'additionalProperties') {
        continue;
      }
      sanitizedObject[key] = this.deepSanitizeSchema(schema[key]);
    }
    return sanitizedObject;
  };

  async initChat(systemInstruction: string) {

    // @ts-ignore
    this.tools = questionMCP.tools.map((tool: any) => { // Added type for tool
      const cleanedSchema = this.deepSanitizeSchema(tool.inputSchema);
      // console.log(`Mapping tool: ${tool.name}. Using Cleaned Schema:`, JSON.stringify(cleanedSchema, null, 2));
      return {
        name: tool.name,
        description: tool.description || `Tool named ${tool.name}`, // Add fallback description
        parameters: cleanedSchema
      };
    });

    console.log("Initializing Google GenAI chat with tools...");

    const response = client.chat.completions.create({
      model: "gpt-4.1",
      messages: [{
        "role": "user", "content": "How's the weather in Hangzhou?"
      }],
      tools: [
        {
          "type": "function",
          "function": this.tools[0]
        }
      ]
    });

    console.log('responseInit', response);
    console.log("Google GenAI chat initialized successfully.");

  }

  async queryAI(text: string) {

    const responseForUser: {
      code: number,
      historyChat: {
        type: string;
        content: any[]
      }[],
      question: (Record<string, unknown> | undefined)[]
    } = {
      code: 200,
      historyChat: [],
      question: []
    };

    const response1 = await client.chat.completions.create({
      model: "gpt-4.1",
      messages: [{
        role: "user",
        content: text
      }],
      tools: [
        {
          "type": "function",
          "function": this.tools[0]
        }
      ]
    });

    console.log('response1', response1);

    responseForUser.code = 200;
    responseForUser.historyChat.push({
      type: 'assistent',
      content: ['respondió la AI']
    });

    // if (response1?.candidates?.[0]?.content?.parts?.[0]?.functionCall) {
    //   const functionCall = response1.candidates[0].content.parts[0].functionCall;
    //   console.log('Function Call:', functionCall);

    //   const toolName = functionCall.name;
    //   const toolArgs = functionCall.args;

    //   console.log('toolArgs:', JSON.stringify(toolArgs, null, 2));

    //   const response2 = await chat.sendMessage({
    //     message: JSON.stringify(toolArgs),
    //     config: {
    //       systemInstruction: `Con la información proporcionada, podrías ir haciendome solo una pregunta a la vez. Yo te contestaré las demás en las siguientes interacciones. Comienza en la primera pregunta por preguntarme mi nombre`,
    //       toolConfig: {
    //         functionCallingConfig: {
    //           // Force the model to call the specified function
    //           mode: FunctionCallingConfigMode.ANY,
    //           // Specify the exact tool name to force
    //           allowedFunctionNames: ['start-recommendation-flow']
    //         }
    //       }
    //     }
    //   });

    //   // console.log('response2', response2?.candidates?.[0]?.content?.parts);

    //   console.log('checktoolArgs', toolArgs);
      
    //   // @ts-ignore
    //   const checkForDataComplete = Object.keys(toolArgs).map((key: string) => {

    //     if (toolArgs) {
    //       // @ts-ignore
    //       const { value, active } = toolArgs[key];
    //       return { value, active }
    //     } else {
    //       return {
    //         value: '',
    //         active: false
    //       }
    //     }
    //   });

    //   console.log('checkForDataComplete', checkForDataComplete);
  
    //   let checker = checkForDataComplete.every((v:{ active: boolean, value: any }) => !!v.value);

    //   if (checker) {

    //     console.log('checkForDataComplete2', checker);

    //     const alertsData = await makeLLMAlgoliaRequest(toolArgs);
    
    //     if (!alertsData ) {
    //       return {
    //         content: [
    //           {
    //             type: "text",
    //             text: `Ha occurido el siguiente error ${alertsData} hay que informar al usuario`,
    //           }
    //         ],
    //       };
    //     }

    //     const response3 = await chat.sendMessage({
    //       message: alertsData,
    //       config: {
    //         systemInstruction: "Respondeme con las mejores casas del la lista que te di",
    //       }
    //     });

    //     responseForUser.code = 200;
    //     responseForUser.historyChat.push({
    //       type: 'assistent',
    //       content: [response3.candidates?.[0]?.content?.parts]
    //     });

    //     return responseForUser;

    //   } else {

    //     responseForUser.code = 200;
    //     responseForUser.historyChat.push({
    //       type: 'assistent',
    //       content: [response2.candidates?.[0]?.content?.parts]
    //     });
    //     responseForUser.question = [toolArgs]


    //     return responseForUser;
    //   }

    // } else if (response1?.candidates?.[0]?.content?.parts?.[0]?.text) {
    //   responseForUser.code = 200;
    //   responseForUser.historyChat.push({
    //     type: "assistent",
    //     content: [response1.candidates[0].content.parts[0].text]
    //   })
    //   return responseForUser
    // } else {
    //   responseForUser.code = 500;
    //   responseForUser.historyChat.push({
    //     type: 'user',
    //     content: ['']
    //   })
    //   return responseForUser;
    // }

  }

};


export const AI = () => {}
