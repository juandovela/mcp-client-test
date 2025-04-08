import { Anthropic } from "@anthropic-ai/sdk";
import {
  MessageParam,
  Tool
} from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import readline from "readline/promises";
import { algoliasearch } from "algoliasearch";
import dotenv from "dotenv";
// import { Tool } from "@google/genai";



interface IFOptionQuestions {
	text: string;
}

interface IFQuestions {
	id: string;
	text: string;
	typeInput: string;
	options: IFOptionQuestions[]
}

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

export class MCPClient {
  private mcp: Client;
  // private anthropic: Anthropic;
  private transport: StdioClientTransport | null = null;
  private tools: Tool[] = [];

  private conversationHistory: MessageParam[] = [];

  constructor() {

    this.mcp = new Client({
      name: "mcp-client-cli", version: "1.0.0"
    } );
  }
  // methods will go here

  getTools() {

    const tool = this.tools[0];
    console.log(tool);
    return tool;
  } 

  async getCallTool(name:string, argumentsSD:Record<string, unknown> | undefined) {
    return this.mcp.callTool({
      name: name,
      arguments: argumentsSD,
    });
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

    } catch (e) {
      console.log("Failed to connect to MCP server: ", e);
      throw e;
    }
  }

  async processQuery(query :MessageParam) {


  }
  
  async cleanup() {
    await this.mcp.close();
  }

}
