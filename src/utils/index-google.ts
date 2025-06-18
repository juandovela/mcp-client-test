import dotenv from "dotenv";
import { Chat, FunctionCallingConfigMode, GoogleGenAI, Part } from "@google/genai";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { makeLLMAlgoliaRequest } from './AlgoliaConnect.js'
import { response } from "express";

dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

let chat: Chat | undefined;

const eventFlow = {
  "tools": [
    {
      "name": "start-recommendation-flow",
      "description": "Next proerty has 2 options, questions an hotspots, i need you to fill the questions with the user data and hotspots with the order of hotspots and their properties, you need guide user in order",
      "inputSchema": {
        "type": "object",
        "properties": {
          "status": {
            "type": "object",
            "properties": {
              "completed": {
                "type": "boolean",
                "description": "Indica si todas las preguntas han sido contestadas"
              },
              "currentQuestion": {
                "type": "string",
                "description": "UID de la pregunta actual (q01, q02, etc.)"
              },
              "totalQuestions": {
                "type": "number",
                "description": "Número total de preguntas en el flujo"
              },
              "answeredQuestions": {
                "type": "number",
                "description": "Número de preguntas contestadas"
              }
            },
            "required": ["completed", "currentQuestion", "totalQuestions", "answeredQuestions"],
            "additionalProperties": false
          },
          "q01": {
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
              "options": {
                "type": "object",
                "properties": {
                  "type": {
                    "type": "string",
                    "description": "input"
                  },
                  "values": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "description": "Para input puede estar vacío"
                  }
                },
                "required": ["type", "values"],
                "additionalProperties": false,
                "description": "Configuración del input para la pregunta"
              }
            },
            "required": [
              "uid",
              "value",
              "options"
            ],
            "additionalProperties": false,
            "description": "Return name, value, uid and options of the question"
          },
          "q02": {
            "type": "object",
            "properties": {
              "uid": {
                "type": "string",
                "description": "q02"
              },
              "value": {
                "type": "string",
                "description": "En que ciudad te gustaría buscar una casa?"
              },
              "options": {
                "type": "object",
                "properties": {
                  "type": {
                    "type": "string",
                    "description": "select"
                  },
                  "values": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "description": "Opciones: Las Vegas, Austin, Phoenix"
                  }
                },
                "required": ["type", "values"],
                "additionalProperties": false,
                "description": "Configuración del select para la pregunta"
              }
            },
            "required": [
              "uid",
              "value",
              "options"
            ],
            "additionalProperties": false,
            "description": "Return name, value, uid and options of the question"
          },
          "q03": {
            "type": "object",
            "properties": {
              "uid": {
                "type": "string",
                "description": "q03"
              },
              "value": {
                "type": "string",
                "description": "Cual es tu presupuesto?"
              },
              "options": {
                "type": "object",
                "properties": {
                  "type": {
                    "type": "string",
                    "description": "range"
                  },
                  "values": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "description": "Opciones: min 150,000, max 500,000"
                  }
                },
                "required": ["type", "values"],
                "additionalProperties": false,
                "description": "Configuración del select para la pregunta"
              }
            },
            "required": [
              "uid",
              "value",
              "options"
            ],
            "additionalProperties": false,
            "description": "Return name, value, uid and options of the question"
          }
        },
        "required": ["q01", "q02", "q03"],
        "additionalProperties": false
      }
    }
  ]
}

interface Question {
  uid: string;
  value: string;
  active: boolean;
  options: {
    type: string;
    values: string[];
  };
}

interface QuestionsStatus {
  completed: boolean;
  currentQuestion: string;
  totalQuestions: number;
  answeredQuestions: number;
  nextQuestion?: string;
}

interface Questions {
  status?: QuestionsStatus;
  [key: string]: Question | QuestionsStatus | undefined;
}

interface ToolArgs {
  questions?: Questions;
  [key: string]: any;
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
    this.tools = eventFlow.tools.map((tool: any) => { // Added type for tool
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
          parts: [{ text: "Inicializando chat para ayudar al usuario" }],
        }
      ],
    });
    console.log("Google GenAI chat initialized successfully.");

  }
  async queryAIIFrame(text: string, history: any[], flowType: 'questions' | 'hotspots' = 'questions') {
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

    let systemInstruction = '';
    if (flowType === 'questions') {
      systemInstruction = `Con la información proporcionada, necesito que me ayudes a obtener las respuestas del usuario.
      Sigue el orden de las preguntas definidas en el schema.
      Para cada pregunta:
      - Si no tiene valor, es la pregunta actual y debes hacerla
      - Si tiene valor, ya fue contestada y puedes pasar a la siguiente
      - Si todas tienen valor, el flujo está completo
      
      Actualiza el status de las preguntas:
      - completed: true si todas las preguntas tienen valor
      - currentQuestion: el uid de la pregunta actual (la primera sin valor)
      - nextQuestion: el uid de la siguiente pregunta (si existe)
      - totalQuestions: número total de preguntas en el flujo
      - answeredQuestions: número de preguntas que tienen valor`;
    } else {
      systemInstruction = `Con la información del las tools, necesito que me vayas guiando paso a paso con los puntos que hay en la tool, 
      cada uno tiene un hotspot y multiples materiales a cambiar, ve guiándolo uno por uno, 
      la estuctura tiene un estado para que le pongas en la llave "value", 
      el estado "visited" si ya fue visitado o visit si es el punto a visitar, 
      una vez que el usuario eliga material, puedes marcarlo como visitado y añadirle al siguiente visit`;
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
            mode: FunctionCallingConfigMode.ANY,
            allowedFunctionNames: ['start-recommendation-flow']
          }
        },
        systemInstruction: systemInstruction
      }
    });

    if (response1?.candidates?.[0]?.content?.parts?.[0]?.functionCall) {
      const functionCall = response1.candidates[0].content.parts[0].functionCall;
      console.log('Function Call:', functionCall);

      const toolName = functionCall.name;
      const toolArgs = functionCall.args as ToolArgs;

      console.log('toolArgs:', JSON.stringify(toolArgs, null, 2));

      // Actualizar el status de las preguntas
      if (flowType === 'questions' && toolArgs.questions) {
        const questions = toolArgs.questions;

        // Obtener todas las preguntas (excluyendo el status)
        const questionKeys = Object.keys(questions).filter(key => key !== 'status');
        const totalQuestions = questionKeys.length;

        // Contar preguntas contestadas
        const answeredQuestions = questionKeys.filter(key => {
          const question = questions[key] as Question;
          return question && question.value && question.value.trim() !== '';
        }).length;

        // Determinar la pregunta actual y la siguiente
        let currentQuestion = '';
        let nextQuestion = '';

        for (let i = 0; i < questionKeys.length; i++) {
          const key = questionKeys[i];
          const question = questions[key] as Question;

          if (!question.value || question.value.trim() === '') {
            currentQuestion = key;
            nextQuestion = questionKeys[i + 1] || '';
            break;
          }
        }

        // Si no hay pregunta actual, significa que todas están contestadas
        if (!currentQuestion && questionKeys.length > 0) {
          currentQuestion = questionKeys[questionKeys.length - 1];
        }

        questions.status = {
          completed: answeredQuestions === totalQuestions,
          currentQuestion,
          nextQuestion,
          totalQuestions,
          answeredQuestions
        };
      }

      const response2 = await chat.sendMessage({
        message: JSON.stringify(toolArgs),
        config: {
          systemInstruction: flowType === 'questions'
            ? `Con la información proporcionada, necesito que me ayudes a obtener el nombre del usuario. 
               Si el usuario no ha proporcionado su nombre, pregúntale cómo se llama. 
               Si ya proporcionó su nombre, pregúntale en qué ciudad le gustaría buscar una casa.
               Las opciones de ciudades son: Phoenix, Austin, Las Vegas.
               Usa la función start-recommendation-flow con el formato correcto para las preguntas q01 (nombre) y q02 (ciudad).
               Actualiza el status de las preguntas:
               - completed: true si todas las preguntas tienen valor
               - currentQuestion: el uid de la pregunta actual (q01 o q02)
               - totalQuestions: 2 (total de preguntas en el flujo)
               - answeredQuestions: número de preguntas que tienen valor`
            : `Con la información del las tools, necesito que me vayas guiando paso a paso con los puntos que hay en la tool, 
               cada uno tiene un hotspot y multiples materiales a cambiar, ve guiándolo uno por uno, 
               la estuctura tiene un estado para que le pongas en la llave "value", 
               el estado "visited" si ya fue visitado o visit si es el punto a visitar, 
               una vez que el usuario eliga material, puedes marcarlo como visitado y añadirle al siguiente visit`,
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingConfigMode.ANY,
              allowedFunctionNames: ['start-recommendation-flow']
            }
          }
        }
      });

      console.log('checktoolArgs', toolArgs);

      // @ts-ignore
      const checkForDataComplete = Object.keys(toolArgs).map((key: string) => {
        if (toolArgs) {
          // @ts-ignore
          const { value } = toolArgs[key];
          return { value }
        } else {
          return {
            value: ''
          }
        }
      });

      console.log('checkForDataComplete', checkForDataComplete);

      let checker = false;

      if (checker) {
        console.log('checkForDataComplete2', checker);

        const response3 = await chat.sendMessage({
          message: [`Vayamos a seleccionar otro material en el siguiente hotspot`],
          config: {
            systemInstruction: "Checa las siguientes opciones de hotspot y materiales, si el usuario ha elegido un material, cambia el estado a visited, si no ha elegido ninguno, deja el estado en visit",
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
      responseForUser.text = response1.candidates[0].content.parts;
      responseForUser.historyChat.push({
        role: "model",
        parts: response1.candidates[0].content.parts
      })
      return responseForUser
    } else {
      responseForUser.code = 500;
      responseForUser.historyChat.push({
        role: 'user',
        parts: [{}]
      })
      return responseForUser;
    }
  }

};


export const AI = () => {



}
