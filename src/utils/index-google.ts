
import dotenv from "dotenv";
import { Chat, FunctionCallingConfigMode, GoogleGenAI, Part, Type } from "@google/genai";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { makeLLMAlgoliaRequest } from './AlgoliaConnect.js'
import { response } from "express";

dotenv.config();

const history = [
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

const eventsIframe = {
  "tools": [
    {
      "name": "start-recommendation-flow",
      "description": "Actualiza el estado de la personalización de los hotspots de la escena, incluyendo qué hotspot se está editando y qué material se ha seleccionado. Siempre devuelve el estado completo de todos los hotspots para mantener el historial de las elecciones.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "customization_state": {
            "type": "object",
            "description": "El objeto principal que contiene el estado completo de todos los hotspots y el progreso de la personalización, cuando vayas guiando al usuario por los hotspots hazlo por orden, los hotspot tienen uno incluido para facilitar la guía.",
            "properties": {
              "hotspotEntry": {
                "type": "object",
                "properties": {
                  "order": {
                    "type": "integer",
                    "description": "1"
                  },
                  "uid": {
                    "type": "string",
                    "description": "1"
                  },
                  "name": {
                    "type": "string",
                    "description": "entry"
                  },
                  "status": {
                    "type": "string",
                    "description": "Indica si el hotspot ya ha sido personalizado ('visited') o si aún está pendiente ('pending').",
                    "enum": ["pending", "visited"]
                  },
                  "available_materials": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "id": { "type": "string", "description": "ID del material, ej. '1'" },
                        // "name": { "type": "string", "description": "Nombre del material, ej. 'Mármol Blanco'" }
                      },
                      "required": [
                        "id",
                        // "name"
                      ]
                    },
                    "description": "Opciones de materiales disponibles para la entrada. El modelo debe referirse a estas opciones. Dale opciones numéricas del 1 al 5 solamente y que elija un numero, el valor del número cambiara la propiedad de material_selected_id"
                  },
                  "material_selected_id": {
                    "type": "string",
                    "description": "El ID del material que el usuario ha elegido para la entrada. Si no ha elegido ninguno, se deja en vacío. Cuando se selecciona un material,  el 'status' de este hotspot debe cambiar a 'visited'."
                  }
                },
                "required": [
                  "uid",
                  "name",
                  "status",
                  "available_materials",
                  "material_selected_id"
                ],
                "additionalProperties": false
              },
              "hotspotFinish": {
                "type": "object",
                "properties": {
                  "order": {
                    "type": "integer",
                    "description": "2"
                  },
                  "uid": {
                    "type": "string",
                    "description": "2"
                  },
                  "name": {
                    "type": "string",
                    "description": "finish"
                  },
                  "status": {
                    "type": "string",
                    "description": "Indica si el hotspot ya ha sido personalizado ('visited') o si aún está pendiente ('pending').",
                    "enum": ["pending", "visited"]
                  },
                  "available_materials": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "id": { "type": "string", "description": "ID del material, ej. '1'" },
                        // "name": { "type": "string", "description": "Nombre del material, ej. 'Baldosa Gris'" }
                      },
                      "required": [
                        "id",
                        // "name"
                      ]
                    },
                    "description": "Opciones de materiales disponibles para el 'finish'. El modelo debe referirse a estas opciones. Dale opciones numéricas del 1 al 5 solamente y que elija un numero, el valor del número cambiara la propiedad de material_selected_id"
                  },
                  "material_selected_id": {
                    "type": "string",
                    "description": "El ID del material que el usuario ha elegido para el 'finish'. Si no ha elegido ninguno, se deja en vacío. Cuando se selecciona un material,   si no le gusta puede seleccionar otro material y si confirma, el 'status' de este hotspot debe cambiar a 'visited'."
                  }
                },
                "required": [
                  "uid",
                  "name",
                  "status",
                  "available_materials",
                  "material_selected_id"
                ],
                "additionalProperties": false
              },
              "hotspotGarage": {
                "type": "object",
                "properties": {
                  "order": {
                    "type": "integer",
                    "description": "3"
                  },
                  "uid": {
                    "type": "string",
                    "description": "3"
                  },
                  "name": {
                    "type": "string",
                    "description": "garage"
                  },
                  "status": {
                    "type": "string",
                    "description": "Indica si el hotspot ya ha sido personalizado ('visited') o si aún está pendiente ('pending').",
                    "enum": ["pending", "visited"]
                  },
                  "available_materials": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "id": { "type": "string", "description": "ID del material, ej. '1'" },
                        // "name": { "type": "string", "description": "Nombre del material, ej. 'Baldosa Gris'" }
                      },
                      "required": [
                        "id",
                        // "name"
                      ]
                    },
                    "description": "Opciones de materiales disponibles para el garage. El modelo debe referirse a estas opciones. Dale opciones numéricas del 1 al 5 solamente y que elija un numero, el valor del número cambiara la propiedad de material_selected_id"
                  },
                  "material_selected_id": {
                    "type": "string",
                    "description": "El ID del material que el usuario ha elegido para el garage. Si no ha elegido ninguno, se deja en vacío. Cuando se selecciona un material,   si no le gusta puede seleccionar otro material y si confirma, el 'status' de este hotspot debe cambiar a 'visited'."
                  }
                },
                "required": [
                  "uid",
                  "name",
                  "status",
                  "available_materials",
                  "material_selected_id"
                ],
                "additionalProperties": false
              },
              "hotspotRoof": {
                "type": "object",
                "properties": {
                  "order": {
                    "type": "integer",
                    "description": "4"
                  },
                  "uid": {
                    "type": "string",
                    "description": "4"
                  },
                  "name": {
                    "type": "string",
                    "description": "roof"
                  },
                  "status": {
                    "type": "string",
                    "description": "Indica si el hotspot ya ha sido personalizado ('visited') o si aún está pendiente ('pending').",
                    "enum": ["pending", "visited"]
                  },
                  "available_materials": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "id": { "type": "string", "description": "ID del material, ej. '1'" },
                        // "name": { "type": "string", "description": "Nombre del material, ej. 'Baldosa Gris'" }
                      },
                      "required": [
                        "id",
                        // "name"
                      ]
                    },
                    "description": "Opciones de materiales disponibles para el roof. El modelo debe referirse a estas opciones. Dale opciones numéricas del 1 al 5 solamente y que elija un numero, el valor del número cambiara la propiedad de material_selected_id"
                  },
                  "material_selected_id": {
                    "type": "string",
                    "description": "El ID del material que el usuario ha elegido para el roof. Si no ha elegido ninguno, se deja en vacío. Cuando se selecciona un material,   si no le gusta puede seleccionar otro material y si confirma, el 'status' de este hotspot debe cambiar a 'visited'."
                  }
                },
                "required": [
                  "uid",
                  "name",
                  "status",
                  "available_materials",
                  "material_selected_id"
                ],
                "additionalProperties": false
              },
              "hotspotTrim": {
                "type": "object",
                "properties": {
                  "order": {
                    "type": "integer",
                    "description": "5"
                  },
                  "uid": {
                    "type": "string",
                    "description": "5"
                  },
                  "name": {
                    "type": "string",
                    "description": "trim"
                  },
                  "status": {
                    "type": "string",
                    "description": "Indica si el hotspot ya ha sido personalizado ('visited') o si aún está pendiente ('pending').",
                    "enum": ["pending", "visited"]
                  },
                  "available_materials": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "id": { "type": "string", "description": "ID del material, ej. '1'" },
                        // "name": { "type": "string", "description": "Nombre del material, ej. 'Baldosa Gris'" }
                      },
                      "required": [
                        "id", 
                        // "name"
                      ]
                    },
                    "description": "Opciones de materiales disponibles para el trim. El modelo debe referirse a estas opciones. Dale opciones numéricas del 1 al 5 solamente y que elija un numero, el valor del número cambiara la propiedad de material_selected_id"
                  },
                  "material_selected_id": {
                    "type": "string",
                    "description": "El ID del material que el usuario ha elegido para el trim. Si no ha elegido ninguno, se deja en vacío. Cuando se selecciona un material,   si no le gusta puede seleccionar otro material y si confirma, el 'status' de este hotspot debe cambiar a 'visited'."
                  }
                },
                "required": [
                  "uid",
                  "name",
                  "status",
                  "available_materials",
                  "material_selected_id"
                ],
                "additionalProperties": false
              },
              "hotspotWindow": {
                "type": "object",
                "properties": {
                  "order": {
                    "type": "integer",
                    "description": "6"
                  },
                  "uid": {
                    "type": "string",
                    "description": "5"
                  },
                  "name": {
                    "type": "string",
                    "description": "window"
                  },
                  "status": {
                    "type": "string",
                    "description": "Indica si el hotspot ya ha sido personalizado ('visited') o si aún está pendiente ('pending').",
                    "enum": ["pending", "visited"]
                  },
                  "available_materials": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "id": { "type": "string", "description": "ID del material, ej. '1'" },
                        // "name": { "type": "string", "description": "Nombre del material, ej. 'Baldosa Gris'" }
                      },
                      "required": [
                        "id",
                        // "name"
                      ]
                    },
                    "description": "Opciones de materiales disponibles para la ventana. El modelo debe referirse a estas opciones. Dale opciones numéricas del 1 al 5 solamente y que elija un numero, el valor del número cambiara la propiedad de material_selected_id"
                  },
                  "material_selected_id": {
                    "type": "string",
                    "description": "El ID del material que el usuario ha elegido para la ventana. Si no ha elegido ninguno, se deja en vacío. Cuando se selecciona un material,   si no le gusta puede seleccionar otro material y si confirma, el 'status' de este hotspot debe cambiar a 'visited'."
                  }
                },
                "required": [
                  "uid",
                  "name",
                  "status",
                  "available_materials",
                  "material_selected_id"
                ],
                "additionalProperties": false
              },
              "hotspotFloor": {
                "type": "object",
                "properties": {
                  "order": {
                    "type": "integer",
                    "description": "7"
                  },
                  "uid": {
                    "type": "string",
                    "description": "interior"
                  },
                  "name": {
                    "type": "string",
                    "description": "floor"
                  },
                  "status": {
                    "type": "string",
                    "description": "Indica si el hotspot ya ha sido personalizado ('visited') o si aún está pendiente ('pending').",
                    "enum": ["pending", "visited"]
                  },
                  "available_materials": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "id": { "type": "string", "description": "ID del material, ej. '1'" },
                        // "name": { "type": "string", "description": "Nombre del material, ej. 'Baldosa Gris'" }
                      },
                      "required": [
                        "id",
                        // "name"
                      ]
                    },
                    "description": "Opciones de materiales disponibles para el floor. El modelo debe referirse a estas opciones. Dale opciones numéricas del 1 al 3 solamente y que elija un numero, el valor del número cambiara la propiedad de material_selected_id"
                  },
                  "material_selected_id": {
                    "type": "string",
                    "description": "El ID del material que el usuario ha elegido para el floor. Si no ha elegido ninguno, se deja en vacío. Cuando se selecciona un material,   si no le gusta puede seleccionar otro material y si confirma, el 'status' de este hotspot debe cambiar a 'visited'."
                  }
                },
                "required": [
                  "uid",
                  "name",
                  "status",
                  "available_materials",
                  "material_selected_id"
                ],
                "additionalProperties": false
              },
              "hotspotKitchenette": {
                "type": "object",
                "properties": {
                  "order": {
                    "type": "integer",
                    "description": "8"
                  },
                  "uid": {
                    "type": "string",
                    "description": "8"
                  },
                  "name": {
                    "type": "string",
                    "description": "kitchenette"
                  },
                  "status": {
                    "type": "string",
                    "description": "Indica si el hotspot ya ha sido personalizado ('visited') o si aún está pendiente ('pending').",
                    "enum": ["pending", "visited"]
                  },
                  "available_materials": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "id": { "type": "string", "description": "ID del material, ej. '1'" },
                        // "name": { "type": "string", "description": "Nombre del material, ej. 'Baldosa Gris'" }
                      },
                      "required": [
                        "id",
                        // "name"
                      ]
                    },
                    "description": "Opciones de materiales disponibles para el kitchenette. El modelo debe referirse a estas opciones. Dale opciones numéricas del 1 al 2 solamente y que elija un numero, el valor del número cambiara la propiedad de material_selected_id"
                  },
                  "material_selected_id": {
                    "type": "string",
                    "description": "El ID del material que el usuario ha elegido para el kitchenette. Si no ha elegido ninguno, se deja en vacío. Cuando se selecciona un material,   si no le gusta puede seleccionar otro material y si confirma, el 'status' de este hotspot debe cambiar a 'visited'."
                  }
                },
                "required": [
                  "uid",
                  "name",
                  "status",
                  "available_materials",
                  "material_selected_id"
                ],
                "additionalProperties": false
              },
              "hotspotKitchen": {
                "type": "object",
                "properties": {
                  "order": {
                    "type": "integer",
                    "description": "9"
                  },
                  "uid": {
                    "type": "string",
                    "description": "9"
                  },
                  "name": {
                    "type": "string",
                    "description": "kitchen"
                  },
                  "status": {
                    "type": "string",
                    "description": "Indica si el hotspot ya ha sido personalizado ('visited') o si aún está pendiente ('pending').",
                    "enum": ["pending", "visited"]
                  },
                  "available_materials": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "id": { "type": "string", "description": "ID del material, ej. '1'" },
                        // "name": { "type": "string", "description": "Nombre del material, ej. 'Baldosa Gris'" }
                      },
                      "required": [
                        "id",
                        // "name"
                      ]
                    },
                    "description": "Opciones de materiales disponibles para la cocina. El modelo debe referirse a estas opciones. Dale opciones numéricas del 1 al 2 solamente y que elija un numero, el valor del número cambiara la propiedad de material_selected_id"
                  },
                  "material_selected_id": {
                    "type": "string",
                    "description": "El ID del material que el usuario ha elegido para la cocina. Si no ha elegido ninguno, se deja en vacío. Cuando se selecciona un material,   si no le gusta puede seleccionar otro material y si confirma, el 'status' de este hotspot debe cambiar a 'visited'."
                  }
                },
                "required": [
                  "uid",
                  "name",
                  "status",
                  "available_materials",
                  "material_selected_id"
                ],
                "additionalProperties": false
              },
              "current_hotspot_being_customized_uid": {
                "type": "string",
                "description": "El UID del hotspot que actualmente el usuario debe personalizar. Este UID se determina por el orden predefinido de los hotspots y cuál es el siguiente 'pending'. Si todos están 'visited', este campo debe ser vacío."
              },
              "next_user_instruction": {
                "type": "string",
                "description": "Un mensaje claro y guiado para el usuario, indicando qué hacer a continuación. Por ejemplo: 'Ahora personaliza la Cocina. ¿Qué material eliges?' o 'Excelente. Pasemos al Suelo.' Si todos los hotspots están 'visited', el mensaje debe indicar que la personalización ha terminado."
              },
              "flow_status": {
                "type": "string",
                "description": "El estado general del flujo de personalización: 'in_progress' si hay hotspots pendientes, o 'completed' si todos los hotspots han sido visitados y se les ha seleccionado un material.",
                "enum": ["in_progress", "completed"]
              }
            },
            "required": [
              "hotspotEntry",
              "hotspotFinish",
              "hotspotGarage",
              "hotspotRoof",
              "hotspotTrim",
              "hotspotWindow",
              "hotspotFloor",
              "hotspotKitchenette",
              "hotspotKitchen",
              "current_hotspot_being_customized_uid",
              "next_user_instruction",
              "flow_status"
            ],
            "additionalProperties": false
          }
        },
        "required": ["customization_state"],
        "$schema": "http://json-schema.org/draft-07/schema#"
      }
    }
  ]
}

const eventFlow = {
  "tools": [
    {
      "name": "start-recommendation-flow",
      "description": "Next proerty has 2 options, questions and hotspots, i need you to fill the questions with the user data and hotspots with the order of hotspots and their properties, you need guide user in order",
      "inputSchema": {
        "type": "object",
        "properties": {
          "questions": {
            "type": "object",
            "description": "Ask user for their name. The name can be their own name or a generic one like 'guest' or 'friend'.",
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
                "description": "Return name, value and uid of the question"
              }
            },
            "required": [ "questionNameJSON" ],
            "additionalProperties": false
          },
          "hotspot": {
            "type": "object",
            "description": "If questions are answered, then start the customization flow. Hotspot contains order of hotspots and their properties, you need guide user in order",
            "properties": {
              "hotspotEntry": {
                "type": "object",
                "properties": {
                  "uid": {
                    "type": "string",
                    "description": "1"
                  },
                  "name": {
                    "type": "string",
                    "description": "entry"
                  },
                  "status": {
                    "type": "string",
                    "description": "Check if the hotspot has been customized or not. If it is customized, it should be 'visited', otherwise 'pending'.",
                    "enum": [
                      "pending",
                      "visited"
                    ]
                  },
                  "available_materials": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "string",
                          "description": "ID del material, ej. '1'"
                        }
                      },
                      "required": [
                        "id"
                      ]
                    },
                    "description": "Option of materials available for the entry. The model should refer to these options. Give options from 1 to 3 and let the user choose a number, the value of the number will change the property of material_selected_id"
                  },
                  "material_selected_id": {
                    "type": "string",
                    "description": "This is uid that user has selected for the entry. If not selected, leave it empty. When a material is selected, the 'status' of this hotspot should change to 'visited'."
                  }
                },
                "required": [
                  "uid",
                  "name",
                  "status",
                  "available_materials",
                  "material_selected_id"
                ],
                "additionalProperties": false
              },
              "hotspotFinish": {
                "type": "object",
                "properties": {
                  "uid": {
                    "type": "string",
                    "description": "2"
                  },
                  "name": {
                    "type": "string",
                    "description": "finish"
                  },
                  "status": {
                    "type": "string",
                    "description": "Check if the hotspot has been customized or not. If it is customized, it should be 'visited', otherwise 'pending'.",
                    "enum": [
                      "pending",
                      "visited"
                    ]
                  },
                  "available_materials": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "string",
                          "description": "ID del material, ej. 'floor_mat_1'"
                        },
                        "name": {
                          "type": "string",
                          "description": "Nombre del material, ej. 'Baldosa Gris'"
                        }
                      },
                      "required": [
                        "id",
                        "name"
                      ]
                    },
                    "description": "Option of materials available for the finish. The model should refer to these options. Give options from 1 to 3 and let the user choose a number, the value of the number will change the property of material_selected_id"
                  },
                  "material_selected_id": {
                    "type": "string",
                    "description": "This is uid that user has selected for the finish. If not selected, leave it empty. When a material is selected, the 'status' of this hotspot should change to 'visited'."
                  }
                },
                "required": [
                  "uid",
                  "name",
                  "status",
                  "available_materials",
                  "material_selected_id"
                ],
                "additionalProperties": false
              }
            },
            "required": [
              "hotspotEntry",
              "hotspotFinish"
            ],
            "additionalProperties": false
          },
          "actualState": {
            "type": "object",
            "description": "This is the actual state of the customization flow. It contains the current hotspot being customized and the questions that have been answered.",
            "properties": {
              "current_hotspot_being_customized_uid": {
                "type": "string",
                "description": "This is the uid of the current hotspot being customized.",
                "additionalProperties": false
              }
            },
            "required": [ "current_hotspot_being_customized_uid"],
            "additionalProperties": false
          }
        },
        "required": [
          "questions", "hotspot", "actualState"
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

  async queryAI(text: string, history: any[]) {

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

      let checker = checkForDataComplete.every((v: { active: boolean, value: any }) => !!v.value);

      if (checker) {

        console.log('checkForDataComplete2', checker);

        const alertsData = await makeLLMAlgoliaRequest(toolArgs);

        if (!alertsData) {
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
        parts: [{}]
      })
      return responseForUser;
    }

  }

  async queryAIIFrame(text: string, history: any[]) {

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

      const response2 = await chat.sendMessage({
        message: JSON.stringify(toolArgs),
        config: {
          systemInstruction: `Con la información del las tools, necesito que me vayas guiando paso a paso con los puntos que hay en la tool, cada uno tiene un hotspot y multiples materiales a cambiar, ve guiándolo uno por uno, la estuctura tiene un estado para que le pongas en la llave "value", el estado "visited" si ya fue visitado o visit si es el punto a visitar, una vez que el usuario eliga material, puedes marcarlo como visitado y añadirle al siguiente visit`,
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

      // console.log('response2', response2?.candidates?.[0]?.content?.parts);

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
        parts: [{}]
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
        parts: [{
          text: 'error'
        }]
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

      let checker = checkForDataComplete.every((v: { active: boolean, value: any }) => !!v.value);

      if (checker) {

        console.log('checkForDataComplete2', checker);

        const alertsData = await makeLLMAlgoliaRequest(toolArgs);

        if (!alertsData) {
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

  async queryAIHistoryIframe() {

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
    this.tools = eventFlow.tools.map((tool: any) => { // Added type for tool
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
        parts: [{
          text: 'error'
        }]
      })
      return responseForUser;
    }

    const response1 = await chat.sendMessage({
      message: 'Podrías preguntarme por un hotspot que me gustaría ver en la casa, solo dame las opciones que estan en la lista previamente proporcionada?',
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

      const response2 = await chat.sendMessage({
        message: JSON.stringify(toolArgs),
        config: {
          systemInstruction: `Con la información proporcionada, dame dame la lista de opciones para que el usuario pueda elegir una, y luego me mandes la opción elegida por funcion calling`,
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

      let checker = checkForDataComplete.every((v: { active: boolean, value: any }) => !!v.value);

      if (checker) {

        console.log('checkForDataComplete2', checker);

        const alertsData = await makeLLMAlgoliaRequest(toolArgs);

        if (!alertsData) {
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
            systemInstruction: "Regresame la opción que el usuario eligió, si eligio una",
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
      console.log('Not function call:', response1.candidates?.[0]?.content?.parts);
      responseForUser.code = 200;
      responseForUser.historyChat.push({
        role: 'model',
        parts: response1.candidates?.[0]?.content?.parts
      });
      responseForUser.text = response1.candidates?.[0]?.content?.parts
      responseForUser.question = []

      return responseForUser;
    }

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
