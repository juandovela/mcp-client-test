import { Anthropic } from "@anthropic-ai/sdk";
import {
  MessageParam,
  Tool,
} from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import readline from "readline/promises";
import { algoliasearch } from "algoliasearch";
import dotenv from "dotenv";


dotenv.config();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is not set");
}

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

const questions: IFQuestions[] = [
	{
		id: "q_01",
		text: "Cual es tu nombre?",
		typeInput: "text",
		options: [
			{
				text: "Invite"
			},
			{
				text: "Guess"
			}
		]
	},
	{
		id: "q_02",
		text: "En que ciudad estás buscando un hogar?",
		typeInput: "text",
		options: [
			{
				text: "Phoenix"
			},
			{
				text: "Austin"
			}
		]
	}
]

class MCPClient {
  private mcp: Client;
  private anthropic: Anthropic;
  private transport: StdioClientTransport | null = null;
  private tools: Tool[] = [];

  private conversationHistory: MessageParam[] = [];

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });
    this.mcp = new Client({
      name: "mcp-client-cli", version: "1.0.0"
    } );
  }
  // methods will go here

  getTools() {
    return this.tools;
  }

  async connectToServer(serverScriptPath: string) {
    try {
      const isJs = serverScriptPath.endsWith(".js");
      const isPy = serverScriptPath.endsWith(".py");
      if (!isJs && !isPy) {
        throw new Error("Server script must be a .js or .py file");
      }
      const command = isPy
        ? process.platform === "win32"
          ? "python"
          : "python3"
        : process.execPath;
      
      this.transport = new StdioClientTransport({
        command,
        args: [serverScriptPath],
      });
      this.mcp.connect(this.transport);

      const toolsResult = await this.mcp.listTools();
      this.tools = toolsResult.tools.map((tool) => {
        return {
          name: tool.name,
          description: tool.description,
          input_schema: tool.inputSchema,
        };
      });
      console.log(
        "Connected to server with tools:",
        this.tools.map(({ name }) => name)
      );
    } catch (e) {
      console.log("Failed to connect to MCP server: ", e);
      throw e;
    }
  }

  // tarea, limpiar código para que solo haga una llamada a la api server.tool por dato y sea claude quien interprete

  async processQuery(query :MessageParam) {

    this.conversationHistory.push(query);
  
    const response = await this.anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      messages: this.conversationHistory,
      tools: this.tools,
    });

    console.log("claude responde:", response);
  
    const finalText = [];
    const toolResults = [];
  
    for (const content of response.content) {
      if (content.type === "text") {
        finalText.push(content.text);


      } else if (content.type === "tool_use") {

        // console.log("jsonfrom tool:", content.input);
        const toolName = content.name;
        const toolArgs = content.input as {
          questionNameJSON:
            {
              uid:string;
              name:string;
              active:boolean,
              options:string[]
            },
            questionLocationJSON:
              {
                uid:string;
                location: string,
                active:boolean,
                options:string[]
              },
              questionBedsJSON:
              {
                uid:string;
                bed:number;
                active:boolean;
                options:string[]
              },
              questionGarageJSON:
              {
                uid:string;
                garage:number;
                active:boolean,
                options:string
              }
            } | undefined;
  
        const result = await this.mcp.callTool({
          name: toolName,
          arguments: toolArgs,
        });
        toolResults.push(result);
        // finalText.push(
        //   `[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`
        // );

        this.conversationHistory.push({
          role: "user",
          content: result.content as string,
        });

        console.log('entro para checar', toolArgs)

        if(toolArgs) {

          const { questionNameJSON, questionBedsJSON, questionGarageJSON, questionLocationJSON } = toolArgs;
          if( !questionLocationJSON.active) {
            
            console.log('datos completos')
            const r = await client.search({
              requests: [
                {
                  indexName: 'test-algolia',
                  query: `${'phoenix'}`,
                  filters: `_origin.division.name:${'phoenix'}`,
                  numericFilters: [
                    `specs.minBed:${1} TO ${7}`,
                    `specs.minGarage:${1} TO ${4}`
                  ]
                }
              ]
            });

            // @ts-ignore
            const { hits } = r.results[0];

            const listOfHouse:{type: 'text', text: string}[] = hits.map((lot:any) => {

              const specs = JSON.stringify(lot.specs);

              return {
                type: "text",
                text: `Encontramos en la siguiente comunidad ${lot._origin.community.name}, en la ciudad de ${lot._origin.division.name}, con las siguientes specs: ${specs}`,
              }
            })

            this.conversationHistory.push({
              role: "user",
              content: listOfHouse
            });

          }
        }
  
        const response = await this.anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1000,
          messages: this.conversationHistory,
        });
  
        finalText.push(
          response.content[0].type === "text" ? response.content[0].text : ""
        );
      }
    }

    this.conversationHistory.push({
      role: "assistant",
      content: finalText.join("\n"),
    });
  
    return finalText.join("\n");
  }

  async chatLoop() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  
    try {

      const firstQuery:MessageParam = {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Usa la herramienta start-recommendation-flow, podrías comenzar preguntando mi nombre y continuar con el flujo una pregunta a la vez'
          }
        ]
      }

      const response = await this.processQuery(firstQuery);

      console.log("\nMCP Client Started!");
      console.log("Type your queries or 'quit' to exit.");
      console.log("\n", response);
  
      while (true) {
        const message = await rl.question("\nQuery: ");
        if (message.toLowerCase() === "quit") {
          break;
        }

        const messageParsed:MessageParam = {
          role: 'user',
          content: [
            {
              type: 'text',
              text: message,
            }
          ]
        }

        const response = await this.processQuery(messageParsed);
        
        console.log("\n" + response);
      }
    } catch(e) {

      console.log("falle:",  e);

      rl.close();
    }
  }
  
  async cleanup() {
    await this.mcp.close();
  }

}

async function main() {
  if (process.argv.length < 3) {
    console.log("Usage: node index.ts <path_to_server_script>");
    return;
  }
  const mcpClient = new MCPClient();
  try {
    await mcpClient.connectToServer(process.argv[2]);
    await mcpClient.chatLoop();
  } finally {
    await mcpClient.cleanup();
    process.exit(0);
  }
}

main();
