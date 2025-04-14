import { McpServer,  } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { algoliasearch } from "algoliasearch";
import { ConverToZOD, GetOnlyQuestions } from "../utils/ConvertToZOD";
import { boolean, z, ZodArray } from "zod"; 

// Create server instance
export const server = new McpServer({
	name: "vu-mcp-server",
	version: "1.0.0",
  methodHandlers: {
    'mcp.initialize': (data:any) => {

      // @ts-ignore
      flow.update({
        paramSchema: { permission: z.enum(["admin"]) }, // change validation rules
      });

    },
    // ... other method handlers
  },
	capabilities: {
		prompt: {},
		resources: {},
		tools: {}
	}
});

interface IFUserData {
	firstTime: boolean;
	name: string;
	location: {
		state?: string,
		city: string
	};
	motivation: string[]
	budget: number;
	numberRooms: number;
	sizeArea: number;
}

interface IFContent {
	type: string;
	text: string;
	data?: IFUserData;
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

// Objeto para almacenar las conversaciones de los usuarios
// En un entorno real, esto debería ser una base de datos persistente
const userSessions = {};

async function makeLLMAlgoliaRequest(data: {
	location: string,
	bed: number,
	garage: number
}) {

	const { location, bed, garage } = data;

	const r = await client.search({
    requests: [
      {
        indexName: 'test-algolia',
        query: `${location}`,
        filters: `_origin.division.name:${location}`,
        numericFilters: [
          `specs.minBed:${bed -1} TO ${bed+1}`,
          `specs.minGarage:${garage -1} TO ${garage+1}`
        ]
      }
    ]
  })

  return r;

}


const testingExternalData = GetOnlyQuestions();

console.log('si salgo en la tv');

// Tool para iniciar el flujo de conversación
const flow = server.tool(
	"start-recommendation-flow",
	"Please refill data of schema with data gave for user",
	testingExternalData,
	//@ts-ignore
	async ({ questionNameJSON, questionLocationJSON, questionBedsJSON, questionGarageJSON }) => {

		if(questionNameJSON.value && questionLocationJSON.value && questionBedsJSON.value && questionGarageJSON.value) {

		const alertsData = await makeLLMAlgoliaRequest({
			location: questionLocationJSON.value,
			bed: questionBedsJSON.value,
			garage: questionGarageJSON.value
		});

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
	
		// @ts-ignore
		const { hits } = alertsData.results[0];

		const listOfHouse:{type: 'text', text: string}[] = hits.map((lot:any) => {

			const specs = JSON.stringify(lot.specs);

			return {
				type: "text",
				text: `Encontramos en la siguiente comunidad ${lot._origin.community.name}, en la ciudad de ${lot._origin.division.name}, con las siguientes specs: ${specs}`,
			}
		})

		return {
			content: listOfHouse
		};

		} else {

			return {
				content: [
					{
						type: "text",
						text: 'Los datos no se han completado',
					},
					{
						type: "text",
						text: JSON.stringify(questionNameJSON),
					},
					{
						type: "text",
						text: JSON.stringify(questionLocationJSON),
					},
					{
						type: "text",
						text: JSON.stringify(questionBedsJSON),
					},
					{
						type: "text",
						text: JSON.stringify(questionGarageJSON),
					}
				],
			};

		}

	}
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Real Estate MCP Server running on stdio");

// async function main() {
// 	const transport = new StdioServerTransport();
// 	await server.connect(transport);
// 	console.error("Real Estate MCP Server running on stdio");
// }

// main().catch((error) => {
// 	console.error("Fatal error in main():", error);
// 	process.exit(1);
// });
