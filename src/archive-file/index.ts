import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { algoliasearch } from "algoliasearch";
import { z } from "zod";

interface ForecastPeriod {
  name?: string;
  temperature?: number;
  temperatureUnit?: string;
  windSpeed?: string;
  windDirection?: string;
  shortForecast?: string;
}

interface AlertsResponse {
  features: AlertFeature[];
}

interface PointsResponse {
  properties: {
    forecast?: string;
  };
}

interface ForecastResponse {
  properties: {
    periods: ForecastPeriod[];
  };
}

interface AlertFeature {
  properties: {
    event?: string;
    areaDesc?: string;
    severity?: string;
    status?: string;
    headline?: string;
  };
}

const NWS_API_BASE = "https://api.weather.gov";
const USER_AGENT = "weather-app/1.0";

// Create server instance
const server = new McpServer({
  name: "weather",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// const clients = algoliasearch('5WEGK1QY4E', '8df8e55bc82b699d19038a0fa007f3d7');
// const recommendClients = clients.initRecommend();
// const recommendClient = algoliarecommend('5WEGK1QY4E', '8df8e55bc82b699d19038a0fa007f3d7');
// const client = recommendClient('5WEGK1QY4E', '8df8e55bc82b699d19038a0fa007f3d7');

const client = algoliasearch('5WEGK1QY4E', '8df8e55bc82b699d19038a0fa007f3d7');

// const index = searchClients.initIndex('test-algolia');


async function makeLLMAlgoliaRequest(data:{ numberRooms:number, sizeArea:number, location: string }): Promise<any | null> {

  // return {
  //   "uid": "8CxT9vupwb2O7APl1P9k",
  //   "priceMin": 100000,
  //   "priceMax": 400000,
  //   "_origin": {
  //       "community": {
  //           "uid": "ONFnDFxYoVRNPHO9pTYv",
  //           "name": "Terravella Voyage Collection"
  //       },
  //       "division": {
  //           "uid": "iZ3wuPFAl66XNO3rweBY",
  //           "name": "Phoenix"
  //       },
  //       "uid": "iZ3wuPFAl66XNO3rweBY.ONFnDFxYoVRNPHO9pTYv"
  //   },
  //   "name": "Yosemite",
  //   "status": "active",
  //   "specs": {
  //       "bed": "4-5",
  //       "level": "2",
  //       "garage": "4",
  //       "sqft": 4205,
  //       "bath": "3.5-4.5",
  //       "minBed": 4,
  //       "maxBed": 5,
  //       "minBath": 3.5,
  //       "maxBath": 4.5,
  //       "minGarage": 4,
  //       "maxGarage": 4
  //   },
  //   "image": "https://firebasestorage.googleapis.com/v0/b/taylor-morrison-vu.appspot.com/o/basegroup%2F8CxT9vupwb2O7APl1P9k%2FTo6JgBVrzlhYKQ1U7EsU%2Fassets%2F46531a3b-25b3-42ee-b9c0-ec19dcdc9ff2.jpg?alt=media&token=d903cb47-d071-45dd-8263-98e814f8eb61",
  //   "objectID": "4196228001",
  //   "_highlightResult": {
  //       "_origin": {
  //           "division": {
  //               "name": {
  //                   "value": "<em>Phoenix</em>",
  //                   "matchLevel": "full",
  //                   "fullyHighlighted": true,
  //                   "matchedWords": [
  //                       "phoenix"
  //                   ]
  //               }
  //           }
  //       },
  //       "name": {
  //           "value": "Yosemite",
  //           "matchLevel": "none",
  //           "matchedWords": []
  //       },
  //       "specs": {
  //           "bed": {
  //               "value": "4-5",
  //               "matchLevel": "none",
  //               "matchedWords": []
  //           },
  //           "sqft": {
  //               "value": "4205",
  //               "matchLevel": "none",
  //               "matchedWords": []
  //           }
  //       },
  //       "image": {
  //           "value": "https://firebasestorage.googleapis.com/v0/b/taylor-morrison-vu.appspot.com/o/basegroup%2F8CxT9vupwb2O7APl1P9k%2FTo6JgBVrzlhYKQ1U7EsU%2Fassets%2F46531a3b-25b3-42ee-b9c0-ec19dcdc9ff2.jpg?alt=media&token=d903cb47-d071-45dd-8263-98e814f8eb61",
  //           "matchLevel": "none",
  //           "matchedWords": []
  //       }
  //   }
  // }

  const { numberRooms, sizeArea, location } = data;
  const city = location;

  client.search({
    requests: [
      {
        indexName: 'test-algolia',
        query: `${location}`,
        filters: `_origin.division.name:${city}`,
        numericFilters: [
          `specs.bed:${numberRooms -2} TO ${numberRooms +2}`,
          `specs.sqrt:${sizeArea -2000} TO ${numberRooms +200}}`
        ]
      },
    ],
  }).then(({ hits }:any) => {
    console.log(hits);
    return hits;
  });

}

// Helper function for making NWS API requests
async function makeNWSRequest<T>(url: string): Promise<T | null> {
  const headers = {
    "User-Agent": USER_AGENT,
    Accept: "application/geo+json",
  };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error("Error making NWS request:", error);
    return null;
  }
}

// Format alert data
function formatAlert(feature: AlertFeature): string {
  const props = feature.properties;
  return [
    `Event: ${props.event || "Unknown"}`,
    `Area: ${props.areaDesc || "Unknown"}`,
    `Severity: ${props.severity || "Unknown"}`,
    `Status: ${props.status || "Unknown"}`,
    `Headline: ${props.headline || "No headline"}`,
    "---",
  ].join("\n");
}

// Register weather tools
server.tool(
  "get-recommendations",
  "Get recommendations for houses in sale",
  {
    numberRooms: z.number().min(1).max(20).describe("Ideal numbers of room for necesities"),
    budget: z.number().min(1000).max(10000000).describe("Budget get from user for house"),
    sizeArea: z.number().min(1).max(10000).describe("Ideal space in square feets for necesities"),
    location: z.string().describe('Get city where user search house')
  },

  async ({ numberRooms, sizeArea, location, budget }) => {

    if(!location) {
      return {
        content: [
          {
            type: "text",
            text: "Podrías decirnos la ciudad donde busques tu futuro hogar? Y claude podrías brindarle al usuario un input range para que pueda seleccionar el ajuste de precios",
          },
        ],
      };
    }

    if(!budget ) {
      return {
        content: [
          {
            type: "text",
            text: "Podrías contarnos cual es el precio proximado que buscas para tu hogar?",
          },
        ],
      };
    }

    const alertsData = await makeLLMAlgoliaRequest({
      numberRooms,
      sizeArea,
      location
    });

    if (!alertsData) {
      return {
        content: [
          {
            type: "text",
            text: "Podrías proporcionarme tu presupuesto",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `La siguiente casa podría se de tu agrado ${alertsData._origin.community.name}`,
        },
        {
          type: "text",
          text: `Se encuentra en ${alertsData._origin.division.name}`,
        },
        {
          type: "text",
          text: `Con las siguientes specs: ${alertsData.specs.bed} cuartos, ${alertsData.specs.bed} pisos y ${alertsData.specs.garage} `,
        },
        {
          type: "text",
          text: `El precio ronda entre ${alertsData.priceMin}  y ${alertsData.priceMax}`,
        }
      ],
    };
  },
);

// Register weather tools
server.tool(
  "get-alerts",
  "Get weather alerts for a state",
  {
    state: z.string().length(2).describe("Two-letter state code (e.g. CA, NY)"),
  },
  async ({ state }) => {
    const stateCode = state.toUpperCase();
    const alertsUrl = `${NWS_API_BASE}/alerts?area=${stateCode}`;
    const alertsData = await makeNWSRequest<AlertsResponse>(alertsUrl);

    if (!alertsData) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve alerts data",
          },
        ],
      };
    }

    const features = alertsData.features || [];
    if (features.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No active alerts for ${stateCode}`,
          },
        ],
      };
    }

    const formattedAlerts = features.map(formatAlert);
    const alertsText = `Active alerts for ${stateCode}:\n\n${formattedAlerts.join("\n")}`;

    return {
      content: [
        {
          type: "text",
          text: alertsText,
        },
      ],
    };
  },
);

server.tool(
  "get-forecast",
  "Get weather forecast for a location",
  {
    latitude: z.number().min(-90).max(90).describe("Latitude of the location"),
    longitude: z.number().min(-180).max(180).describe("Longitude of the location"),
  },
  async ({ latitude, longitude }) => {
    // Get grid point data
    const pointsUrl = `${NWS_API_BASE}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const pointsData = await makeNWSRequest<PointsResponse>(pointsUrl);

    if (!pointsData) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve grid point data for coordinates: ${latitude}, ${longitude}. This location may not be supported by the NWS API (only US locations are supported).`,
          },
        ],
      };
    }

    const forecastUrl = pointsData.properties?.forecast;
    if (!forecastUrl) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to get forecast URL from grid point data",
          },
        ],
      };
    }

    // Get forecast data
    const forecastData = await makeNWSRequest<ForecastResponse>(forecastUrl);
    if (!forecastData) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve forecast data",
          },
        ],
      };
    }

    const periods = forecastData.properties?.periods || [];
    if (periods.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No forecast periods available",
          },
        ],
      };
    }

    // Format forecast periods
    const formattedForecast = periods.map((period: ForecastPeriod) =>
      [
        `${period.name || "Unknown"}:`,
        `Temperature: ${period.temperature || "Unknown"}°${period.temperatureUnit || "F"}`,
        `Wind: ${period.windSpeed || "Unknown"} ${period.windDirection || ""}`,
        `${period.shortForecast || "No forecast available"}`,
        "---",
      ].join("\n"),
    );

    const forecastText = `Forecast for ${latitude}, ${longitude}:\n\n${formattedForecast.join("\n")}`;

    return {
      content: [
        {
          type: "text",
          text: forecastText,
        },
      ],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Weather MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});