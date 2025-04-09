import {Anthropic} from "@anthropic-ai/sdk";
import {MessageParam, Tool} from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import {Client} from "@modelcontextprotocol/sdk/client/index.js";
import {StdioClientTransport} from "@modelcontextprotocol/sdk/client/stdio.js";
import readline from "readline/promises";
import {algoliasearch} from "algoliasearch";
import dotenv from "dotenv";
import {Chat, FunctionCallingConfigMode, GenerateContentResponse, GoogleGenAI} from "@google/genai";
import {response} from "express";

dotenv.config();

interface IFOptionQuestions {
    text: string;
}

interface IFQuestions {
    id: string;
    text: string;
    typeInput: string;
    options: IFOptionQuestions[]
}

const client = algoliasearch('5WEGK1QY4E', '8df8e55bc82b699d19038a0fa007f3d7');

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const ai = new GoogleGenAI({apiKey: GOOGLE_API_KEY});

let chat: Chat | undefined;

export class MCPClient {
    private mcp : Client;
    // private anthropic: Anthropic;
    private transport : StdioClientTransport | null = null;
    private tools : Tool[] = [];

    private conversationHistory : MessageParam[] = [];

    constructor() {

        this.mcp = new Client({name: "mcp-client-cli", version: "1.0.0"});
    }

    private deepSanitizeSchema = (schema : any): any => {
        if (schema === null || typeof schema !== 'object') {
            return schema;
        }
        if (Array.isArray(schema)) {
            return schema.map(item => this.deepSanitizeSchema(item));
        }
        const sanitizedObject: {
        [key: string]: any
        } = {};
        for (const key in schema) {
            if (key === '$schema' || key === 'additionalProperties') {
                continue;
            }
            sanitizedObject[key] = this.deepSanitizeSchema(schema[key]);
        }
        return sanitizedObject;
    };

    async connectToServer(serverScriptPath : string): Promise < void > { // Added return type
        console.log(`Attempting to connect to server: ${serverScriptPath}`);
        try {
            const isJs = serverScriptPath.endsWith(".js");
            const isPy = serverScriptPath.endsWith(".py");
            if (! isJs && ! isPy) {
                throw new Error("Server script must be a .js or .py file");
            }
            const command = isPy ? process.platform === "win32" ? "python" : "python3" : process.execPath;

            console.log(`Using command: ${command}`);
            this.transport = new StdioClientTransport({command, args: [serverScriptPath]});
            await this.mcp.connect(this.transport); // Added await here
            console.log("MCP transport connected.");

            const toolsResult = await this.mcp.listTools();
            console.log("Received tools from MCP:", JSON.stringify(toolsResult, null, 2));

            // Map and sanitize tools
            // @ts-ignore
            this.tools = toolsResult.tools.map((tool : any) => { // Added type for tool
                const cleanedSchema = this.deepSanitizeSchema(tool.inputSchema);
                console.log(`Mapping tool: ${
                    tool.name
                }. Using Cleaned Schema:`, JSON.stringify(cleanedSchema, null, 2));
                return {
                    name: tool.name,
                    description: tool.description || `Tool named ${
                        tool.name
                    }`, // Add fallback description
                    parameters: cleanedSchema
                };
            });

            console.log("Processed and sanitized tools:", JSON.stringify(this.tools, null, 2));
            console.log("Tools ready:", this.tools.map(({name}) => name));

            // *** Initialize chat AFTER tools are populated ***
            if (this.tools.length > 0) {
                console.log("Initializing Google GenAI chat with tools...");
                chat = ai.chats.create({
                    model: "gemini-2.0-flash", // Consider making model configurable
                    config: {
                        systemInstruction: `Con la ayuda de la tool star-recommendation-flow brindada, necesito que me vayas guiando con las preguntas para poder encontrar un hogar, haz una pregunta a la vez. Luego usa la tool para mandar llamar la api de algolia`,
                        tools: [
                            {
                                functionDeclarations: this.tools // Now this.tools is populated
                            }
                        ]
                    },
                    history: [
                        { // Initial history for the chat session
                            role: "user",
                            parts: [
                                {
                                    text: "Iniciando chat para buscar casa"
                                }
                            ]
                        },
                        // Optional: Add an initial assistant message if needed
                        // {
                        //     role: "assistant",
                        //     parts: [{ text: "¡Hola! Claro, comencemos. ¿Cuál es tu nombre?" }]
                        // }
                    ]
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
                    history: [
                        {
                            role: "user",
                            parts: [
                                {
                                    text: "Iniciando chat para buscar casa"
                                }
                            ]
                        }
                    ]
                });
                console.log("Google GenAI chat initialized WITHOUT tools.");
            }

        } catch (e) {
            console.error("Failed to connect to MCP server or initialize chat: ", e);
            // Propagate the error or handle it as needed
            throw e;
        }
    }

    async processQuery(query : {
        role: string;
        content: {
            type: string;
            text: string;
        }[];
    }) {

    const responseForUser = {
        textAI: '',
        jsonData: {},
        toolArgs: {}
    };

        if (! chat) {
            responseForUser.jsonData = {},
            responseForUser.jsonData = 'Errror'
            responseForUser.toolArgs = {}
            return responseForUser;
        }

        const response1 = await chat.sendMessage({
            message: query.content[0].text,
            config: {
                tools: [
                    {
                        functionDeclarations: this.tools
                    },
                ],
                toolConfig: {
                    functionCallingConfig: { // Force the model to call the specified function
                        mode: FunctionCallingConfigMode.ANY,
                        // Specify the exact tool name to force
                        allowedFunctionNames: ['start-recommendation-flow']
                    }
                }
            }
        });
        console.log("response1",response1);
        console.log('response1', response1 ?. candidates ?. [0] ?. content ?. parts);

        if (response1 ?. candidates ?. [0] ?. content ?. parts ?. [0] ?. functionCall) {
            const functionCall = response1.candidates[0].content.parts[0].functionCall;
            console.log('Function Call:', functionCall);

            const toolName = functionCall.name;
            const toolArgs = functionCall.args;

            console.log('toolArgs:', JSON.stringify(toolArgs, null, 2));

            const result = await this.mcp.callTool({
                name: toolName ? toolName : 'star-recommendations-flow',
                arguments: toolArgs
            });

            const response2 = await chat.sendMessage({
                message: JSON.stringify(result.content),
                config: {
                    systemInstruction: `Con la información proporcionada, podrías ir haciendome solo una pregunta a la vez. Yo te contestaré las demás en las siguientes interacciones. Comienza en la primera pregunta por preguntarme mi nombre`,
                    toolConfig: {
                        functionCallingConfig: { // Force the model to call the specified function
                            mode: FunctionCallingConfigMode.ANY,
                            // Specify the exact tool name to force
                            allowedFunctionNames: ['start-recommendation-flow']
                        }
                    }
                }
            });

            // Add safe JSON parsing with error handling
            try {
                // @ts-ignore
                const checkForDataComplete = result.content.map((info : {
                    text: string,
                    type: string
                }) => {
                    console.log('Content to parse:', info.text);
                    try {
                        const parsedData = JSON.parse(info.text);
                        return {
                            active: !parsedData.active,
                            data: parsedData.value
                        };
                    } catch (error) {
                        console.error('Error parsing JSON:', error);
                        // Return a default value when parsing fails
                        return {
                            active: false,
                            data: null
                        };
                    }
                });

                // @ts-ignore
                let checker = checkForDataComplete.every((v) => v.active === true && v.data !== null);
                
                if (checker) {

                    console.log('datos completos')
                    const r = await client.search({
                        requests: [
                            {
                                indexName: 'test-algolia',
                                query: `${
                                    checkForDataComplete[1].data
                                }`,
                                filters: `_origin.division.name:${
                                    checkForDataComplete[1].data
                                }`,
                                numericFilters: [
                                    `specs.minBed:${
                                        checkForDataComplete[2].data - 1
                                    } TO ${
                                        checkForDataComplete[2].data + 1
                                    }`,
                                    `specs.minGarage:${
                                        checkForDataComplete[3].data - 1
                                    } TO ${
                                        checkForDataComplete[3].data + 1
                                    }`
                                ]
                            }
                        ]
                    });

                    // @ts-ignore
                    const {hits} = r.results[0];

                    const listOfHouse: {
                        type: 'text',
                        text: string
                    }[] = hits.map((lot : any) => {

                        const specs = JSON.stringify(lot.specs);

                        return {type: "text", text: `Encontramos en la siguiente comunidad ${
                                lot._origin.community.name
                            }, en la ciudad de ${
                                lot._origin.division.name
                            }, con las siguientes specs: ${specs}`}
                    })

                    const response3 = await chat.sendMessage({
                        message: listOfHouse,
                        config: {
                            systemInstruction: "Respondeme con las mejores casas del la lista que te di"
                        }
                    });

                    responseForUser.jsonData = {
                        response3: response3,
                        result: result,
                        toolArgs: toolArgs
                    };

                    return responseForUser;

                } else {
                    responseForUser.jsonData = {
                        response2: response2,
                        result: result,
                        toolArgs: toolArgs
                    };
                    responseForUser.textAI = 'Text unknow';

                    console.log('this.mcp.callTool', result)
                    console.log('Resutl Call:', result);
                    console.log('toolArgs', toolArgs)

                    return responseForUser;
                }

            } catch{ if (response1 ?. candidates ?. [0] ?. content ?. parts ?. [0] ?. text) {
                console.log('No function call found in the response.');
                console.log('Response Text:', response1.candidates[0].content.parts[0].text);
                responseForUser.textAI = response1.candidates[0].content.parts[0].text;
                return responseForUser
            } else {
                console.log('No content in the response.');
            }
        }


        return responseForUser;
    }
  }
 

};
