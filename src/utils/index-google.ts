
import dotenv from "dotenv";
import { Chat, FunctionCallingConfigMode, GoogleGenAI, Part, Type } from "@google/genai";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { makeLLMAlgoliaRequest } from './AlgoliaConnect.js'
import { response } from "express";

dotenv.config();

const historyComplete = [
  {
    "role": "user",
    "parts": [
      {
        "text": "hola, me ayudas a encontrar una casa?"
      }
    ]
  },
  {
    "role": "model",
    "parts": [
      {
        "text": "¡Claro que sí! Para empezar, ¿cómo te llamas? (¿Prefieres que intente adivinarlo o me lo dices tú?)\n"
      }
    ]
  },
  {
    "role": "user",
    "parts": [
      {
        "text": "hola, me ayudas a encontrar una casa?"
      }
    ]
  },
  {
    "role": "user",
    "parts": [
      {
        "text": "me llamo juan"
      }
    ]
  },
  {
    "role": "model",
    "parts": [
      {
        "text": "¡Mucho gusto, Juan! Ahora que sé tu nombre, ¿en qué ciudad te gustaría buscar una casa? Tenemos opciones en Austin, Phoenix, Washington D.C. y Las Vegas.\n"
      }
    ]
  },
  {
    "role": "user",
    "parts": [
      {
        "text": "en phoenix"
      }
    ]
  },
  {
    "role": "model",
    "parts": [
      {
        "text": "Perfecto, Juan. ¿Cuántos dormitorios te gustaría que tuviera la casa?\n"
      }
    ]
  },
  {
    "role": "user",
    "parts": [
      {
        "text": "3 habitaciones"
      }
    ]
  },
  {
    "role": "model",
    "parts": [
      {
        "text": "Entendido. ¿Y cuántos espacios de estacionamiento o garaje te gustaría tener?\n"
      }
    ]
  },
  {
    "role": "user",
    "parts": [
      {
        "text": "2 garages"
      }
    ]
  }
]

const history = [
  {
    "role": "user",
    "parts": [
      {
        "text": "hola, me ayudas a encontrar una casa?"
      }
    ]
  }
]

const communities = [
  {
    "uid": "zxe8P8f6u0DnB6LLSmu7",
    "divisionUID": "Xzfm1SvOgNInhEU4lUXW",
    "status": "active",
    "name": "Enclave at Deer Crossing",
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Pool",
      "Playground",
      "Dog Park"
    ],
    "_origin": {
      "community": {
        "uid": "rSFc8Fn8SHZYVEkoQUYS",
        "name": "Liberty Reserves "
      },
      "division": {
        "uid": "RXxIILP1RMjeiHKoH547",
        "name": "McCordsville",
        "state": "Indiana"
      }
    }
  },
  {
    "uid": "aBcD1eFgH2iJ3kL4mN5o",
    "divisionUID": "pQrS6tUvW7xY8zZaBcD",
    "status": "inactive",
    "name": "Desert Bloom Condos",
    "amenities": [
      "Desert Landscape",
      "Roof Deck",
      "Co-working Space"
    ],
    "_origin": {
      "community": {
        "uid": "eFgH9iJ0kL1mN2oP3qRs",
        "name": "Southwest Living"
      },
      "division": {
        "uid": "tUvW4xY5zZaB6cD7eF",
        "name": "Phoenix",
        "state": "Arizona"
      }
    }
  },
  {
    "uid": "fGhI2jKlM3nOp4qRsT5u",
    "divisionUID": "vWxY6zAbC7dE8fGhI9jK",
    "status": "active",
    "name": "Capitol Hill Lofts",
    "amenities": [
      "Historic Building",
      "Rooftop Terrace",
      "Gym"
    ],
    "_origin": {
      "community": {
        "uid": "lMnO0pQrS1tUvW2xY3z",
        "name": "Urban Core Living"
      },
      "division": {
        "uid": "aBcD4eFgH5iJ6kL7mN",
        "name": "Washington",
        "state": "District of Columbia"
      }
    }
  },
  {
    "uid": "qWeR3tY4uI5oP6aS7dF",
    "divisionUID": "gHjK8lM9nO0pQ1rS2tU",
    "status": "active",
    "name": "Barton Springs Flats",
    "amenities": [
      "Waterfront Access",
      "Bike Share",
      "Outdoor Grills"
    ],
    "_origin": {
      "community": {
        "uid": "vWxY3zAbC4dE5fGhI6j",
        "name": "Austin Modern Homes"
      },
      "division": {
        "uid": "KlM7nO8pQ9rS0tUvW",
        "name": "Austin",
        "state": "Texas"
      }
    }
  },
  {
    "uid": "zXcV7bN8mM9lK0jH1gF",
    "divisionUID": "dS2aQ3wE4rT5yU6iO7p",
    "status": "pending",
    "name": "Desert Trails Estates",
    "amenities": [
      "Hiking Access",
      "Gated Community",
      "Community Pool"
    ],
    "_origin": {
      "community": {
        "uid": "lKjH0gFdS1aQ2wE3rT",
        "name": "Phoenix Luxury Homes"
      },
      "division": {
        "uid": "yU4iO5pL6kM7jN8bV",
        "name": "Phoenix",
        "state": "Arizona"
      }
    }
  },
  {
    "uid": "nMjU6yH7bG8vF9cD0xZ",
    "divisionUID": "aSdF1gH2jK3lM4nB5vC",
    "status": "active",
    "name": "Georgetown Rowhomes",
    "amenities": [
      "Historic Charm",
      "Walkable District",
      "Boutique Shops Nearby"
    ],
    "_origin": {
      "community": {
        "uid": "xC1vB2n3M4jK5lH6g",
        "name": "DC Heritage Properties"
      },
      "division": {
        "uid": "fD7sA8qW9eR0tY1uI",
        "name": "Washington",
        "state": "District of Columbia"
      }
    }
  },
  {
    "uid": "wErT4yU5iO6pL7kJaSd",
    "divisionUID": "fGhJ8kL9mN0bV1cX2z",
    "status": "active",
    "name": "South Congress Residences",
    "amenities": [
      "Live Music Venues Nearby",
      "Food Truck Access",
      "Modern Design"
    ],
    "_origin": {
      "community": {
        "uid": "oP7lK8jH9gFd0sA1qW",
        "name": "Austin Urban Developments"
      },
      "division": {
        "uid": "eR2tY3uI4oP5aS6dF",
        "name": "Austin",
        "state": "Texas"
      }
    }
  },
  {
    "uid": "aSdf5gH6jKl7mN8bV9c",
    "divisionUID": "xZc1vB2n3M4jK5lH6g",
    "status": "active",
    "name": "Camelback Mountain Homes",
    "amenities": [
      "Mountain Views",
      "Private Pools",
      "Upscale Finishes"
    ],
    "_origin": {
      "community": {
        "uid": "aSdF7gH8jK9lM0nB1v",
        "name": "Desert Oasis Living"
      },
      "division": {
        "uid": "cX2zV3bN4mM5lK6jH",
        "name": "Phoenix",
        "state": "Arizona"
      }
    }
  },
  {
    "uid": "qWertz6uI7oP8aSdF9g",
    "divisionUID": "hJkL0mN1bV2cX3zQ4w",
    "status": "pending",
    "name": "The National Quarter",
    "amenities": [
      "Near Monuments",
      "High Ceilings",
      "Concierge Service"
    ],
    "_origin": {
      "community": {
        "uid": "eR5tY6uI7oP8aSdF9g",
        "name": "Capital Living Group"
      },
      "division": {
        "uid": "hJkL0mN1bV2cX3zQ4w",
        "name": "Washington",
        "state": "District of Columbia"
      }
    }
  },
  {
    "uid": "yXcvB7n8mM9lK0jH1gF",
    "divisionUID": "dS2aQ3wE4rT5yU6iO7p",
    "status": "active",
    "name": "Zilker Park Condos",
    "amenities": [
      "Park Views",
      "Pet Friendly",
      "Close to Downtown"
    ],
    "_origin": {
      "community": {
        "uid": "lKjH0gFdS1aQ2wE3rT",
        "name": "Austin Green Spaces"
      },
      "division": {
        "uid": "yU4iO5pL6kM7jN8bV",
        "name": "Austin",
        "state": "Texas"
      }
    }
  }
]

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

let chat: Chat | undefined;

// const systemInstruction = 'Please refill data of schema with data gave for user'

const question = {
  name: 'start-recommendation-flow',
  description: 'Rellena los datos con información brindada por el usuario, no le hagas otras preguntas que se salgan de los datos',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: 'Pregunta al usuario por su nombre'
      },
      location: {
        type: Type.STRING,
        description: 'Pregunta al usuario por algun lugar de preferencia para buscar hogar',
        enum: ['Phoenix', 'Austin', 'Las Vegas'],
      },
      bed: {
        type: Type.NUMBER,
        description: 'Pregunta al usuario el numero de habitaciones que necesita'
      },
      garage: {
        type: Type.NUMBER,
        description: 'Pregunta al usuario el numero de garajes que necesita'
      },
    },
    required: []
  },
};

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
                "description": "Añade al array los string, guest y friend"
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
                "description": "Añade al array los string, \"Austion\", \"Phoenix\", \"Washington, \"McCordsville\""
              }
            },
            "required": [
              "uid",
              "value",
              "active"
            ],
            "additionalProperties": false,
            "description": "Regresa un json con el uid y el location que ha elegido el usuario"
          }
        },
        "required": [
          "questionNameJSON",
          "questionLocationJSON"
        ],
        "additionalProperties": false,
        "$schema": "http://json-schema.org/draft-07/schema#"
      }
    }
  ]
}

export class MCPClientGemini {

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
    chat = ai.chats.create({
      model: "gemini-2.0-flash", // Consider making model configurable
      config: {
        systemInstruction: `${systemInstruction}`,
        tools: [
          {
            functionDeclarations: this.tools
          }
        ],
      },
      history: [ // Initial history for the chat session
        {
          role: "user",
          parts: [{ text: "Iniciando chat para buscar casa" }],
        }
      ],
    });
    console.log("Google GenAI chat initialized successfully.");

  }

  async queryAI(text: string, history:any[]) {

    history.push({
      role: 'user',
      parts: [{
        text: text
      }]
    })

    const responseForUser: {
      code: number,
      historyChat: {
        role: string;
        parts: Part[] | undefined
      }[],
      text: Part[] | undefined,
      question: (Record<string, unknown> | undefined)[]
    } = {
      code: 200,
      text: undefined,
      historyChat: history,
      question: []
    };

    if (!chat) {
      responseForUser.code = 500;
      responseForUser.historyChat.push({
        role: 'user',
        parts: [{}]
      })
      return responseForUser;
    }

    const response1 = await chat.sendMessage({
      message: text,
      config: {
        tools: [
          {
            functionDeclarations: this.tools
          },
        ],
        toolConfig: {
          functionCallingConfig: {
            // Force the model to call the specified function
            mode: FunctionCallingConfigMode.ANY,
            // Specify the exact tool name to force
            allowedFunctionNames: ['start-recommendation-flow']
          }
        }
      }
    });

    if (response1?.candidates?.[0]?.content?.parts?.[0]?.functionCall) {
      const functionCall = response1.candidates[0].content.parts[0].functionCall;
      console.log('Function Call:', functionCall);

      const toolName = functionCall.name;
      const toolArgs = functionCall.args;

      console.log('toolArgs:', JSON.stringify(toolArgs, null, 2));


      // console.log('response2', response2?.candidates?.[0]?.content?.parts);

      console.log('checktoolArgs', toolArgs);
      
      // @ts-ignore
      const checkForDataComplete = Object.keys(toolArgs).map((key: string) => {

        if (toolArgs) {
          // @ts-ignore
          const { value, active } = toolArgs[key];
          return { value, active }
        } else {
          return {
            value: '',
            active: false
          }
        }
      });

      console.log('checkForDataComplete', checkForDataComplete);
  
      let checker = checkForDataComplete.every((v:{ active: boolean, value: any }) => !!v.value);

      if (checker) {

        console.log('checkForDataComplete2', checker);

        const alertsData = await makeLLMAlgoliaRequest(toolArgs);

        console.log('alertsData', alertsData)
    
        if (!alertsData ) {
          return {
            content: [
              {
                type: "text",
                text: `Ha occurido el siguiente error ${alertsData} hay que informar al usuario`,
              }
            ],
          };
        }

        const response3 = await chat.sendMessage({
          message: alertsData,
          config: {
            systemInstruction: "Respondeme con las 2 mejores casas del la lista que te di con las información que tienes, si crees que solo 1 es mejor, entonces solo esa, resalta las amenidades, y pregunta al usuario si busca algo más conforme a la información que tienes, así podrás filtrar mejor la búsqueda",
          }
        });

        responseForUser.code = 200;
        responseForUser.historyChat.push({
          role: 'model',
          parts: response3.candidates?.[0]?.content?.parts
        });
        responseForUser.text = response3.candidates?.[0]?.content?.parts
        responseForUser.question = [toolArgs]

        return responseForUser;

      } else {

        const response2 = await chat.sendMessage({
          message: JSON.stringify(toolArgs),
          config: {
            systemInstruction: `Con la información proporcionada, podrías ir haciendome solo una pregunta a la vez. Yo te contestaré las demás en las siguientes interacciones. Comienza en la primera pregunta por preguntarme mi nombre`,
            toolConfig: {
              functionCallingConfig: {
                // Force the model to call the specified function
                mode: FunctionCallingConfigMode.ANY,
                // Specify the exact tool name to force
                allowedFunctionNames: ['start-recommendation-flow']
              }
            }
          }
        });

        responseForUser.code = 200;
        responseForUser.historyChat.push({
          role: 'model',
          parts: response2.candidates?.[0]?.content?.parts
        });
        responseForUser.text = response2.candidates?.[0]?.content?.parts;
        responseForUser.question = [toolArgs]


        return responseForUser;
      }

    } else if (response1?.candidates?.[0]?.content?.parts?.[0]?.text) {
      responseForUser.code = 200;
      responseForUser.text 
      responseForUser.historyChat.push({
        role: "model",
        parts: response1.candidates[0].content.parts
      })
      return responseForUser
    } else {
      responseForUser.code = 500;
      responseForUser.historyChat.push({
        role: 'user',
        parts: [{ }]
      })
      return responseForUser;
    }

  }

  async queryAIHistory() {

    const responseForUser: {
      code: number,
      historyChat: {
        role: string;
        parts: Part[] | undefined
      }[],
      text: Part[] | undefined,
      question: (Record<string, unknown> | undefined)[]
    } = {
      code: 200,
      text: undefined,
      historyChat: [],
      question: []
    };

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

    if (!chat) {
      responseForUser.code = 500;
      responseForUser.historyChat.push({
        role: 'user',
        parts: [ {
          text: 'error'
        } ]
      })
      return responseForUser;
    }

    const response1 = await chat.sendMessage({
      message: 'podrías relleñar los datos de la tool con los datos previamente proporcionados?',
      config: {
        tools: [
          {
            functionDeclarations: this.tools
          },
        ],
        toolConfig: {
          functionCallingConfig: {
            // Force the model to call the specified function
            mode: FunctionCallingConfigMode.ANY,
            // Specify the exact tool name to force
            allowedFunctionNames: ['start-recommendation-flow']
          }
        }
      }
    });

    if (response1?.candidates?.[0]?.content?.parts?.[0]?.functionCall) {
      const functionCall = response1.candidates[0].content.parts[0].functionCall;
      console.log('Function Call:', functionCall);

      const toolName = functionCall.name;
      const toolArgs = functionCall.args;

      console.log('toolArgs:', JSON.stringify(toolArgs, null, 2));

      // console.log('response2', response2?.candidates?.[0]?.content?.parts);

      console.log('checktoolArgs', toolArgs);
      
      // @ts-ignore
      const checkForDataComplete = Object.keys(toolArgs).map((key: string) => {

        if (toolArgs) {
          // @ts-ignore
          const { value, active } = toolArgs[key];
          return { value, active }
        } else {
          return {
            value: '',
            active: false
          }
        }
      });

      console.log('checkForDataComplete', checkForDataComplete);
  
      let checker = checkForDataComplete.every((v:{ active: boolean, value: any }) => !!v.value);

      if (checker) {

        console.log('checkForDataComplete2', checker);

        const alertsData = await makeLLMAlgoliaRequest(toolArgs);
    
        if (!alertsData ) {
          return {
            content: [
              {
                type: "text",
                text: `Ha occurido el siguiente error ${alertsData} hay que informar al usuario`,
              }
            ],
          };
        }

        const response3 = await chat.sendMessage({
          message: alertsData,
          config: {
            systemInstruction: "Respondeme con las mejores casas del la lista que te di",
          }
        });

        responseForUser.code = 200;
        responseForUser.historyChat.push({
          role: 'model',
          parts: response3.candidates?.[0]?.content?.parts
        });
        responseForUser.text = response3.candidates?.[0]?.content?.parts;
        responseForUser.question = [toolArgs];

        return responseForUser;

      } else {

        const response2 = await chat.sendMessage({
          message: JSON.stringify(toolArgs),
          config: {
            systemInstruction: `Con la información proporcionada, podrías ir haciendome solo una pregunta a la vez. Yo te contestaré las demás en las siguientes interacciones. Comienza en la primera pregunta por preguntarme mi nombre`,
            toolConfig: {
              functionCallingConfig: {
                // Force the model to call the specified function
                mode: FunctionCallingConfigMode.ANY,
                // Specify the exact tool name to force
                allowedFunctionNames: ['start-recommendation-flow']
              }
            }
          }
        });

        responseForUser.code = 200;
        responseForUser.historyChat.push({
          role: 'model',
          parts: response2.candidates?.[0]?.content?.parts
        });
        responseForUser.text = response2.candidates?.[0]?.content?.parts
        responseForUser.question = [toolArgs]


        return responseForUser;
      }

    } else {
      responseForUser.code = 200;
        responseForUser.historyChat.push({
          role: 'model',
          parts: response1.candidates?.[0]?.content?.parts
        });
        responseForUser.text = response1.candidates?.[0]?.content?.parts
        responseForUser.question = []


        return responseForUser;
    }

    // const response2 = await chat.sendMessage({
    //   message: JSON.stringify(toolArgs),
    //   config: {
    //     systemInstruction: `Con la información proporcionada, podrías ir haciendome solo una pregunta a la vez. Yo te contestaré las demás en las siguientes interacciones. Comienza en la primera pregunta por preguntarme mi nombre`,
    //     toolConfig: {
    //       functionCallingConfig: {
    //         // Force the model to call the specified function
    //         mode: FunctionCallingConfigMode.ANY,
    //         // Specify the exact tool name to force
    //         allowedFunctionNames: ['start-recommendation-flow']
    //       }
    //     }
    //   }
    // });

    // console.log("response", JSON.stringify(response1?.candidates?.[0]));

    // return response;

  }

  async connectToServer(serverScriptPath: string, systemInstruction: string): Promise<void> { // Added return type
    console.log(`Attempting to connect to server: ${serverScriptPath}`);
    try {


      // *** Initialize chat AFTER tools are populated ***
      if (true) {
        console.log("Initializing Google GenAI chat with tools...");
        chat = ai.chats.create({
          model: "gemini-2.0-flash", // Consider making model configurable
          config: {
            systemInstruction: `${systemInstruction}`,
            // tools: [
            //     {
            //         functionDeclarations: this.tools // Now this.tools is populated
            //     }
            // ],
          },
          history: history,
        });
        console.log("Google GenAI chat initialized successfully.");
      } else {
        console.warn("No tools found or processed. Chat not initialized with tools.");
        // Decide if you want to initialize chat without tools or throw an error
        chat = ai.chats.create({
          model: "gemini-2.0-flash",
          config: {
            systemInstruction: `You are a helpful assistant for finding a home. Use the 'star-recommendation-flow' tool to guide the user through questions (name, location, beds, garage) one at a time. After calling the tool, present the result or question to the user. Once all information is gathered (as indicated by the tool's response or conversation), use the 'star-recommendation-flow' tool again with the collected data to trigger the final search action.`
          },
          history: [{ role: "user", parts: [{ text: "Iniciando chat para buscar casa" }], }],
        });
        console.log("Google GenAI chat initialized WITHOUT tools.");
      }

    } catch (e) {
      console.error("Failed to connect to MCP server or initialize chat: ", e);
      // Propagate the error or handle it as needed
      throw e;
    }
  }

  async processQuery(query: string) {

    const responseForUser = {
      textAI: '',
      jsonData: {},
      toolArgs: {}
    };

    if (!chat) {
      responseForUser.jsonData = {},
        responseForUser.jsonData = 'Errror'
      responseForUser.toolArgs = {}
      return responseForUser;
    }

    const response1 = await chat.sendMessage({
      message: query,
      config: {
        tools: [
          {
            functionDeclarations: this.tools
          },
        ],
        toolConfig: {
          functionCallingConfig: {
            // Force the model to call the specified function
            mode: FunctionCallingConfigMode.ANY,
            // Specify the exact tool name to force
            allowedFunctionNames: ['start-recommendation-flow']
          }
        }
      }
    });

    console.log('papdaspad', response1?.candidates?.[0]?.content?.parts);

    if (response1?.candidates?.[0]?.content?.parts?.[0]?.functionCall) {
      const functionCall = response1.candidates[0].content.parts[0].functionCall;
      console.log('Function Call:', functionCall);

      const toolName = functionCall.name;
      const toolArgs = functionCall.args;

      // console.log('toolArgs:', JSON.stringify(toolArgs, null, 2));

      const response2 = await chat.sendMessage({
        message: JSON.stringify(toolArgs),
        config: {
          systemInstruction: `Con la información proporcionada, podrías ir haciendome solo una pregunta a la vez. Yo te contestaré las demás en las siguientes interacciones. Comienza en la primera pregunta por preguntarme mi nombre`,
          toolConfig: {
            functionCallingConfig: {
              // Force the model to call the specified function
              mode: FunctionCallingConfigMode.ANY,
              // Specify the exact tool name to force
              allowedFunctionNames: ['start-recommendation-flow']
            }
          }
        }
      });

      console.log('response2', response2?.candidates?.[0]?.content?.parts);

      console.log('checktoolArgs', toolArgs);

      // @ts-ignore
      const checkForDataComplete = Object.keys(toolArgs).map((key: string) => {

        if (toolArgs) {
          // @ts-ignore
          const { value, active } = toolArgs[key];
          return { value, active }
        } else {
          return {
            value: '',
            active: false
          }
        }
      });

      console.log('checkForDataComplete', checkForDataComplete);

      let checker = checkForDataComplete.every((v: { active: boolean, value: any }) => !!v.value);

      if (checker) {

        const response3 = await chat.sendMessage({
          // @ts-ignore
          message: result.content,
          config: {
            systemInstruction: "Respondeme con las mejores casas del la lista que te di",
          }
        });

        return responseForUser;

      } else {
        responseForUser.jsonData = {
          response2: response2,
          result: toolArgs,
          toolArgs: toolArgs
        };
        responseForUser.textAI = 'Text unknow';
        console.log('toolArgs', toolArgs)

        return responseForUser;
      }

    } else if (response1?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.log('No function call found in the response.');
      console.log('Response Text:', response1.candidates[0].content.parts[0].text);
      responseForUser.textAI = response1.candidates[0].content.parts[0].text;
      return responseForUser
    } else {
      console.log('No content in the response.');
    }


    return responseForUser;
  }

};


export const AI = () => {



}
