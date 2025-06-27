import dotenv from "dotenv";
import { Chat, FunctionCallingConfigMode, GoogleGenAI, Part } from "@google/genai";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { makeLLMAlgoliaRequest } from './AlgoliaConnect.js'
import { response } from "express";

dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

let chat: Chat | undefined;
/* 
const eventFlow = {
  "tools": [
    {
      "name": "start-recommendation-flow",
      "description": "Next proerty has 2 options, questions an hotspots, i need you to fill the questions with the user data and hotspots with the order of hotspots and their properties, you need guide user in order",
      "inputSchema": {
        "type": "object",
        "properties": {
          "questions": {
            "type": "object",
            "properties": {
              "q01": {
                "type": "object",
                "properties": {
                  "uid": { "type": "string", "description": "q01" },
                  "value": { "type": "string", "description": "Nombre con el que se identifica el usuario, puede colocar el suyo o preguntar si lo llamamos invitado o amigo" },
                  "options": {
                    "type": "object",
                    "properties": {
                      "type": { "type": "string", "description": "valor: input" },
                      "values": {
                        "type": "array",
                        "items": { "type": "string", "description": "opciones disponibles para el usuario, valor: friend, guess" },
                        "description": "friend, guess"
                      }
                    },
                    "required": ["type", "values"],
                    "additionalProperties": false,
                    "description": "Configuración de opciones para q01"
                  }
                },
                "required": ["uid", "value", "options"],
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
                    "description": "¿En que ciudad te gustaría buscar una casa?"
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
                          "type": "string",
                        },
                        "description": "agrega al array las opciones de las ciudades Las Vegas, Austin, Phoenix"
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
                        "description": "agrega al array las opciones de presupuesto, valor: min 150,000, max 500,000"
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
              }
            },
            "required": ["q01", "q02", "q03", "status"],
            "additionalProperties": false,
            "description": "Sección de preguntas questions con status y preguntas q01, q02, q03"
          },
          "hotspots": {
            "type": "object",
            "properties": {
              "status": {
                "type": "object",
                "properties": {
                  "completed": { "type": "boolean", "description": "Indica si todas las secciones han sido contestadas" },
                  "currentSection": { "type": "string", "description": "Sección actual (Window Frame, Door, Garage, etc.)" },
                  "nextSection": { "type": "string", "description": "Siguiente sección (si existe)" },
                  "totalSections": { "type": "number", "description": "Número total de secciones" },
                  "answeredSections": { "type": "number", "description": "Número de secciones contestadas" }
                },
                "required": ["completed", "currentSection", "nextSection", "totalSections", "answeredSections"],
                "additionalProperties": false
              },
              "Window Frame": {
                "type": "object",
                "properties": {
                  "uid": { "type": "string", "description": "Identificador del item, valor es '6'" },
                  "value": { "type": "string", "description": "Valor seleccionado para Window Frame" },
                  "status": { "type": "string", "description": "Estado del item, valor: 'pending', 'visited'" },
                  "nameObjectsGroup": { "type": "string", "description": "Nombre del grupo de objetos, valor es 'Window Frame'" },
                  "objectSubtype": { "type": "string", "description": "Subtipo de objeto, valor es 'exterior'" },
                  "uidHotspot": { "type": "string", "description": "UID del hotspot, valor es '6'" },
                  "arrayMaterials": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "nameMaterial": { "type": "string", "description": "Nombre del material, valor: 'mtl_window_frame'" },
                        "name": { "type": "string", "description": "Nombre visible, valor: 'Taupe'" },
                        "description": { "type": "string", "description": "Descripción, valor: 'Taupe window frame'" },
                        "price": { "type": "number", "description": "Precio, valor: 1081" },
                        "color": { "type": "string", "description": "Color hexadecimal, valor: '#BDB099'" },
                        "transparent": { "type": "boolean", "description": "Transparente, valor: false" },
                        "opacity": { "type": "number", "description": "Opacidad, valor: 1" },
                        "texture": { "type": "string", "description": "URL o string de textura, valor: ''" },
                        "textureRepeat": {
                          "type": "object",
                          "properties": {
                            "wrapS": { "type": "number", "description": "Repetición S, valor: 1" },
                            "wrapT": { "type": "number", "description": "Repetición T, valor: 1" }
                          },
                          "required": ["wrapS", "wrapT"],
                          "additionalProperties": false,
                          "description": "repeticion de la textura"
                        },
                        "typeMaterial": { "type": "string", "description": "Tipo de material, valor: 'standard'" },
                        "isGroup": { "type": "boolean", "description": "Es grupo, valor: false" },
                        "normalMap": { "type": "string", "description": "Normal map, valor: ''" },
                        "normalUvRepeat": {
                          "type": "object",
                          "properties": {
                            "wrapS": { "type": "number", "description": "Repetición S, valor: 1" },
                            "wrapT": { "type": "number", "description": "Repetición T, valor: 1" }
                          },
                          "required": ["wrapS", "wrapT"],
                          "additionalProperties": false,
                          "description": "normalUV de la textura"
                        },
                        "meshes": {
                          "type": "array",
                          "items": {
                            "type": "object",
                            "properties": {
                              "nameMesh": { "type": "string", "description": "Nombre del mesh, valor: 'obj_partA_windowzoclo001'" },
                              "orientationUV": { "type": "number", "description": "Orientación UV, valor: 0" }
                            },
                            "required": ["nameMesh", "orientationUV"],
                            "additionalProperties": false,
                            "description": "mesh de la textura"
                          }
                        }
                      },
                      "required": ["nameMaterial", "name", "description", "price", "color", "transparent", "opacity", "texture", "textureRepeat", "typeMaterial", "isGroup", "normalMap", "normalUvRepeat", "meshes"],
                      "additionalProperties": false,
                      "description": "materiales de la textura"
                    }
                  }
                },
                "required": ["uid", "value", "status", "nameObjectsGroup", "objectSubtype", "uidHotspot", "arrayMaterials"],
                "additionalProperties": false,
                "description": "Pregunta Window Frame"
              },
              "Door": {
                "type": "object",
                "properties": {
                  "uid": { "type": "string", "description": "Identificador del item, valor es '1'" },
                  "value": { "type": "string", "description": "Valor seleccionado para Door" },
                  "status": { "type": "string", "description": "Estado del item, valor: 'pending', 'visited'" },
                  "nameObjectsGroup": { "type": "string", "description": "Nombre del grupo de objetos, valor es 'Door'" },
                  "objectSubtype": { "type": "string", "description": "Subtipo de objeto, valor es 'exterior'" },
                  "uidHotspot": { "type": "string", "description": "UID del hotspot, valor es '1'" },
                  "arrayMaterials": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "nameMaterial": { "type": "string", "description": "Nombre del material, valor: 'mtl_door'" },
                        "name": { "type": "string", "description": "Nombre visible, valor: 'Taupe'" },
                        "description": { "type": "string", "description": "Taupe door" },
                        "price": { "type": "number", "description": "Precio, valor: 1081" },
                        "color": { "type": "string", "description": "Color hexadecimal, valor: '#BDB099'" },
                        "transparent": { "type": "boolean", "description": "false" },
                        "opacity": { "type": "number", "description": "1" },
                        "texture": { "type": "string", "description": "''" },
                        "textureRepeat": {
                          "type": "object",
                          "properties": {
                            "wrapS": { "type": "number", "description": "1" },
                            "wrapT": { "type": "number", "description": "1" }
                          },
                          "required": ["wrapS", "wrapT"],
                          "additionalProperties": false
                        },
                        "typeMaterial": { "type": "string", "description": "Tipo de material, valor: 'standard'" },
                        "isGroup": { "type": "boolean", "description": "Es grupo, valor: false" },
                        "normalMap": { "type": "string", "description": "Normal map, valor: ''" },
                        "normalUvRepeat": {
                          "type": "object",
                          "properties": {
                            "wrapS": { "type": "number", "description": "Repetición S, valor: 1" },
                            "wrapT": { "type": "number", "description": "Repetición T, valor: 1" }
                          },
                          "required": ["wrapS", "wrapT"],
                          "additionalProperties": false
                        },
                        "meshes": {
                          "type": "array",
                          "items": {
                            "type": "object",
                            "properties": {
                              "nameMesh": { "type": "string", "description": "Nombre del mesh, valor: 'obj_partA_door001'" },
                              "orientationUV": { "type": "number", "description": "Orientación UV, valor: 0" }
                            },
                            "required": ["nameMesh", "orientationUV"],
                            "additionalProperties": false
                          }
                        }
                      },
                      "required": ["nameMaterial", "name", "description", "price", "color", "transparent", "opacity", "texture", "textureRepeat", "typeMaterial", "isGroup", "normalMap", "normalUvRepeat", "meshes"],
                      "additionalProperties": false
                    }
                  }
                },
                "required": ["uid", "value", "status", "nameObjectsGroup", "objectSubtype", "uidHotspot", "arrayMaterials"],
                "additionalProperties": false,
                "description": "Pregunta Door"
              },
              "Garage": {
                "type": "object",
                "properties": {
                  "uid": { "type": "string", "description": "Identificador del item, valor es '3'" },
                  "value": { "type": "string", "description": "Valor seleccionado para Garage" },
                  "status": { "type": "string", "description": "Estado del item, valor: 'pending', 'visited'" },
                  "nameObjectsGroup": { "type": "string", "description": "Nombre del grupo de objetos, valor es 'Garage'" },
                  "objectSubtype": { "type": "string", "description": "Subtipo de objeto, valor es 'exterior'" },
                  "uidHotspot": { "type": "string", "description": "UID del hotspot, valor es '3'" },
                  "arrayMaterials": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "nameMaterial": { "type": "string", "description": "Nombre del material, valor: 'mtl_garage'" },
                        "name": { "type": "string", "description": "Nombre visible, valor: 'Taupe'" },
                        "description": { "type": "string", "description": "valor: 'Taupe garage'" },
                        "price": { "type": "number", "description": "Precio, valor: 1081" },
                        "color": { "type": "string", "description": "Color hexadecimal, valor: '#BDB099'" },
                        "transparent": { "type": "boolean", "description": "Transparente, valor: false" },
                        "opacity": { "type": "number", "description": "Opacidad, valor: 1" },
                        "texture": { "type": "string", "description": "URL o string de textura, valor: ''" },
                        "textureRepeat": {
                          "type": "object",
                          "properties": {
                            "wrapS": { "type": "number", "description": "Repetición S, valor: 1" },
                            "wrapT": { "type": "number", "description": "Repetición T, valor: 1" }
                          },
                          "required": ["wrapS", "wrapT"],
                          "additionalProperties": false
                        },
                        "typeMaterial": { "type": "string", "description": "Tipo de material, valor: 'standard'" },
                        "isGroup": { "type": "boolean", "description": "Es grupo, valor: false" },
                        "normalMap": { "type": "string", "description": "Normal map, valor: ''" },
                        "normalUvRepeat": {
                          "type": "object",
                          "properties": {
                            "wrapS": { "type": "number", "description": "Repetición S, valor: 1" },
                            "wrapT": { "type": "number", "description": "Repetición T, valor: 1" }
                          },
                          "required": ["wrapS", "wrapT"],
                          "additionalProperties": false
                        },
                        "meshes": {
                          "type": "array",
                          "items": {
                            "type": "object",
                            "properties": {
                              "nameMesh": { "type": "string", "description": "Nombre del mesh, valor: 'obj_partA_garage001'" },
                              "orientationUV": { "type": "number", "description": "Orientación UV, valor: 0" }
                            },
                            "required": ["nameMesh", "orientationUV"],
                            "additionalProperties": false
                          }
                        }
                      },
                      "required": ["nameMaterial", "name", "description", "price", "color", "transparent", "opacity", "texture", "textureRepeat", "typeMaterial", "isGroup", "normalMap", "normalUvRepeat", "meshes"],
                      "additionalProperties": false
                    }
                  }
                },
                "required": ["uid", "value", "status", "nameObjectsGroup", "objectSubtype", "uidHotspot", "arrayMaterials"],
                "additionalProperties": false,
                "description": "Pregunta Garage"
              },
              "Fascia Board": {
                "type": "object",
                "properties": {
                  "uid": { "type": "string", "description": "Identificador del item, valor es '5'" },
                  "value": { "type": "string", "description": "Valor seleccionado para Fascia Board" },
                  "status": { "type": "string", "description": "Estado del item, valor: 'pending', 'visited'" },
                  "nameObjectsGroup": { "type": "string", "description": "Nombre del grupo de objetos, valor es 'Fascia Board'" },
                  "objectSubtype": { "type": "string", "description": "Subtipo de objeto, valor es 'exterior'" },
                  "uidHotspot": { "type": "string", "description": "UID del hotspot, valor es '5'" },
                  "arrayMaterials": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "nameMaterial": { "type": "string", "description": "Nombre del material, valor: 'mtl_window_frame2_1'" },
                        "name": { "type": "string", "description": "Nombre visible, valor: 'Walnut'" },
                        "description": { "type": "string", "description": "valor: 'Taupe garage'" },
                        "price": { "type": "number", "description": "Precio, valor: 4654" },
                        "color": { "type": "string", "description": "Color hexadecimal, valor: '#5F4930'" },
                        "transparent": { "type": "boolean", "description": "Transparente, valor: false" },
                        "opacity": { "type": "number", "description": "Opacidad, valor: 1" },
                        "texture": { "type": "string", "description": "URL o string de textura, valor: ''" },
                        "textureRepeat": {
                          "type": "object",
                          "properties": {
                            "wrapS": { "type": "number", "description": "Repetición S, valor: 1" },
                            "wrapT": { "type": "number", "description": "Repetición T, valor: 1" }
                          },
                          "required": ["wrapS", "wrapT"],
                          "additionalProperties": false
                        },
                        "typeMaterial": { "type": "string", "description": "Tipo de material, valor: 'standard'" },
                        "isGroup": { "type": "boolean", "description": "Es grupo, valor: false" },
                        "normalMap": { "type": "string", "description": "Normal map, valor: ''" },
                        "normalUvRepeat": {
                          "type": "object",
                          "properties": {
                            "wrapS": { "type": "number", "description": "Repetición S, valor: 1" },
                            "wrapT": { "type": "number", "description": "Repetición T, valor: 1" }
                          },
                          "required": ["wrapS", "wrapT"],
                          "additionalProperties": false
                        },
                        "meshes": {
                          "type": "array",
                          "items": {
                            "type": "object",
                            "properties": {
                              "nameMesh": { "type": "string", "description": "Nombre del mesh, valor: 'ext_extra002'" },
                              "orientationUV": { "type": "number", "description": "Orientación UV, valor: 0" }
                            },
                            "required": ["nameMesh", "orientationUV"],
                            "additionalProperties": false
                          }
                        }
                      },
                      "required": ["nameMaterial", "name", "description", "price", "color", "transparent", "opacity", "texture", "textureRepeat", "typeMaterial", "isGroup", "normalMap", "normalUvRepeat", "meshes"],
                      "additionalProperties": false
                    }
                  }
                },
                "required": ["uid", "value", "status", "nameObjectsGroup", "objectSubtype", "uidHotspot", "arrayMaterials"],
                "additionalProperties": false,
                "description": "Pregunta Fascia Board"
              }

            },
            "required": ["Window Frame", "Door", "Garage", "Fascia Board", "status"],
            "additionalProperties": false,
            "description": "Sección de preguntas hotspotscon status, las preguntas son Window Frame, Door, Garage"
          }
        },
        "required": ["questions", "hotspots"],
        "additionalProperties": false,
        "description": "preguntas hotspots y questions"
      }
    }
  ]

}
 */

const dialogFlow = {
  "tools": [
    {
      "name": "simple-questions-flow",
      "description": "Next proerty has 2 options, questions an hotspots, i need you to fill the questions with the user data and hotspots with the order of hotspots and their properties, you need guide user in order",
      "inputSchema": {
        "type": "object",
        "properties": {
          "questions": {
            "type": "object",
            "properties": {
              "q01": {
                "type": "object",
                "properties": {
                  "id": { "type": "string", "description": "q01" },
                  "value": { "type": "string", "description": "Name of the user, guest or friend" },
                  "desc": { "type": "string", "description": "Name of the user, guest or friend" },
                  "response": {
                    "type": "object",
                    "properties": {
                      "options": {
                        "type": "object",
                        "properties": {
                          "type": { "type": "string", "description": "input" },
                          "values": {
                            "type": "array",
                            "items": { "type": "string", "description": "friend, guess" },
                            "description": "add to array friend, guess"
                          }
                        },
                        "required": ["type", "values"],
                        "additionalProperties": false,
                        "description": "Configuración de opciones para q01"
                      }
                    }
                  }
                },
                "required": ["id", "value", "desc", "response"],
                "additionalProperties": false,
                "description": "Return id, value, desc and response of the question"
              },
              "q02": {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string",
                    "description": "q02"
                  },
                  "value": {
                    "type": "string",
                    "description": "¿What city are you looking for a house in?"
                  },
                  "desc": {
                    "type": "string",
                    "description": "What city are you looking for a house in?"
                  },
                  "response": {
                    "type": "object",
                    "properties": {
                      "options": {
                        "type": "object",
                        "properties": {
                          "type": {
                            "type": "string",
                            "description": "value: select"
                          },
                          "values": {
                            "type": "array",
                            "items": {
                              "type": "string",
                            },
                            "description": "add to array: Las Vegas, Austin, Phoenix"
                          }
                        },
                        "required": ["type", "values"],
                        "additionalProperties": false,
                        "description": "Configuración del select para la pregunta"
                      }
                    }
                  }
                },
                "required": ["id", "value", "desc", "response"],
                "additionalProperties": false,
                "description": "Return id, value, desc and response of the question"
              },
              "q03": {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string",
                    "description": "q03"
                  },
                  "value": {
                    "type": "string",
                    "description": "What is your budget?"
                  },
                  "desc": {
                    "type": "string",
                    "description": "What is your budget?"
                  },
                  "response": {
                    "type": "object",
                    "properties": {
                      "options": {
                        "type": "object",
                        "properties": {
                          "type": {
                            "type": "string",
                            "description": "value: range"
                          },
                          "values": {
                            "type": "array",
                            "items": {
                              "type": "string"
                            },
                            "description": "add to array: 150000, 500000"
                          }
                        },
                        "required": ["type", "values"],
                        "additionalProperties": false,
                        "description": "Configuración del select para la pregunta"
                      }
                    }
                  }
                },
                "required": ["id", "value", "desc", "response"],
                "additionalProperties": false,
                "description": "Return id, value, desc and response of the question"
              },
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
              }
            },
            "required": ["q01", "q02", "q03", "status"],
            "additionalProperties": false,
            "description": "Sección de preguntas questions con status y preguntas q01, q02, q03"
          },
          "hotspots": {
            "type": "object",
            "properties": {
              "status": {
                "type": "object",
                "properties": {
                  "completed": { "type": "boolean", "description": "Indica si todas las secciones han sido contestadas" },
                  "currentSection": { "type": "string", "description": "Sección actual (Window Frame, Door, Garage, etc.)" },
                  "nextSection": { "type": "string", "description": "Siguiente sección (si existe)" },
                  "totalSections": { "type": "number", "description": "Número total de secciones" },
                  "answeredSections": { "type": "number", "description": "Número de secciones contestadas" }
                },
                "required": ["completed", "currentSection", "nextSection", "totalSections", "answeredSections"],
                "additionalProperties": false
              },
              "Window Frame": {
                "type": "object",
                "properties": {
                  "id": { "type": "string", "description": "Identificador del item, valor Window Frame" },
                  "value": { "type": "string", "description": "Valor seleccionado para Window Frame" },
                  "desc": { "type": "string", "description": "Window Frame" },
                  "response": {
                    "type": "object",
                    "properties": {
                      "options": {
                        "type": "object",
                        "properties": {
                          "type": { "type": "string", "description": "value: select" },
                          "values": {
                            "type": "array",
                            "items": {
                              "type": "string"
                            },
                            "description": "add to array: Window Frame"
                          }
                        },
                        "required": ["type", "values"],
                        "additionalProperties": false,
                        "description": "Configuración del select para la pregunta"
                      }
                    }
                  }
                },
                "required": ["id", "value", "desc", "response"],
                "additionalProperties": false,
                "description": "Return id, value, desc and response of the question"
              },
              "Door": {
                "type": "object",
                "properties": {
                  "id": { "type": "string", "description": "Identificador del item, valor es Door" },
                  "value": { "type": "string", "description": "Valor seleccionado para Door" },
                  "desc": { "type": "string", "description": "Door" },
                  "response": {
                    "type": "object",
                    "properties": {
                      "options": {
                        "type": "object",
                        "properties": {
                          "type": { "type": "string", "description": "value: select" },
                          "values": {
                            "type": "array",
                            "items": {
                              "type": "string"
                            },
                            "description": "add to array: Door"
                          }
                        },
                      }
                    }
                  }
                },
                "required": ["id", "value", "desc", "response"],
                "additionalProperties": false,
                "description": "Return id, value, desc and response of the question"
              },
              "Garage": {
                "type": "object",
                "properties": {
                  "id": { "type": "string", "description": "Identificador del item, valor es Garage" },
                  "value": { "type": "string", "description": "Valor seleccionado para Garage" },
                  "desc": { "type": "string", "description": "Garage" },
                  "response": {
                    "type": "object",
                    "properties": {
                      "options": {
                        "type": "object",
                        "properties": {
                          "type": { "type": "string", "description": "value: select" },
                          "values": {
                            "type": "array",
                            "items": {
                              "type": "string"
                            },
                            "description": "add to array: Garage"
                          }
                        },
                        "required": ["type", "values"],
                        "additionalProperties": false,
                        "description": "Configuración del select para la pregunta"
                      }
                    }
                  }
                },
                "required": ["id", "value", "desc", "response"],
                "additionalProperties": false,
                "description": "Pregunta Garage"
              },
              "Fascia Board": {
                "type": "object",
                "properties": {
                  "id": { "type": "string", "description": "Identificador del item, valor es Fascia Board" },
                  "value": { "type": "string", "description": "Valor seleccionado para Fascia Board" },
                  "desc": { "type": "string", "description": "Fascia Board" },
                  "response": {
                    "type": "object",
                    "properties": {
                      "options": {
                        "type": "object",
                        "properties": {
                          "type": { "type": "string", "description": "value: select" },
                          "values": {
                            "type": "array",
                            "items": {
                              "type": "string"
                            },
                            "description": "add to array: Fascia Board"
                          }
                        },
                        "required": ["type", "values"],
                        "additionalProperties": false,
                        "description": "Configuración del select para la pregunta"
                      }
                    }
                  }
                },
                "required": ["id", "value", "desc", "response"],
                "additionalProperties": false,
                "description": "Pregunta Fascia Board"
              },
              "Exterior Wall Cladding": {
                "type": "object",
                "properties": {
                  "id": { "type": "string", "description": "Identificador del item, valor es Exterior Wall Cladding" },
                  "value": { "type": "string", "description": "Valor seleccionado para Exterior Wall Cladding" },
                  "desc": { "type": "string", "description": "Exterior Wall Cladding" },
                  "response": {
                    "type": "object",
                    "properties": {
                      "options": {
                        "type": "object",
                        "properties": {
                          "type": { "type": "string", "description": "value: select" },
                          "values": {
                            "type": "array",
                            "items": {
                              "type": "string"
                            },
                            "description": "add to array: Exterior Wall Cladding"
                          }
                        },
                        "required": ["type", "values"],
                        "additionalProperties": false,
                        "description": "Configuración del select para la pregunta"
                      }
                    }
                  }
                },
                "required": ["id", "value", "desc", "response"],
                "additionalProperties": false,
                "description": "Pregunta Exterior Wall Cladding"
              },
              "Brick Detailing": {
                "type": "object",
                "properties": {
                  "id": { "type": "string", "description": "Identificador del item, valor es Brick Detailing" },
                  "value": { "type": "string", "description": "Valor seleccionado para v" },
                  "desc": { "type": "string", "description": "Brick Detailing" },
                  "response": {
                    "type": "object",
                    "properties": {
                      "options": {
                        "type": "object",
                        "properties": {
                          "type": { "type": "string", "description": "value: select" },
                          "values": {
                            "type": "array",
                            "items": {
                              "type": "string"
                            },
                            "description": "add to array: Brick Detailing"
                          }
                        },
                        "required": ["type", "values"],
                        "additionalProperties": false,
                        "description": "Configuración del select para la pregunta"
                      }
                    }
                  }
                },
                "required": ["id", "value", "desc", "response"],
                "additionalProperties": false,
                "description": "Pregunta Brick Detailing"
              },
              "Roof Covering": {
                "type": "object",
                "properties": {
                  "id": { "type": "string", "description": "Identificador del item, valor es Roof Covering" },
                  "value": { "type": "string", "description": "Valor seleccionado para Roof Covering" },
                  "desc": { "type": "string", "description": "Roof Covering" },
                  "response": {
                    "type": "object",
                    "properties": {
                      "options": {
                        "type": "object",
                        "properties": {
                          "type": { "type": "string", "description": "value: select" },
                          "values": {
                            "type": "array",
                            "items": {
                              "type": "string"
                            },
                            "description": "add to array: Roof Covering"
                          }
                        },
                        "required": ["type", "values"],
                        "additionalProperties": false,
                        "description": "Configuración del select para la pregunta"
                      }
                    }
                  }
                },
                "required": ["id", "value", "desc", "response"],
                "additionalProperties": false,
                "description": "Pregunta Roof Covering"
              },
              "Floor": {
                "type": "object",
                "properties": {
                  "id": { "type": "string", "description": "Identificador del item, valor es Floor" },
                  "value": { "type": "string", "description": "Valor seleccionado para Floor" },
                  "desc": { "type": "string", "description": "Floor" },
                  "response": {
                    "type": "object",
                    "properties": {
                      "options": {
                        "type": "object",
                        "properties": {
                          "type": { "type": "string", "description": "value: select" },
                          "values": {
                            "type": "array",
                            "items": {
                              "type": "string"
                            },
                            "description": "add to array: Floor"
                          }
                        },
                        "required": ["type", "values"],
                        "additionalProperties": false,
                        "description": "Configuración del select para la pregunta"
                      }
                    }
                  }
                },
                "required": ["id", "value", "desc", "response"],
                "additionalProperties": false,
                "description": "Pregunta Floor"
              },
              "Countertops": {
                "type": "object",
                "properties": {
                  "id": { "type": "string", "description": "Identificador del item, valor es Countertops" },
                  "value": { "type": "string", "description": "Valor seleccionado para Countertops" },
                  "desc": { "type": "string", "description": "Countertops" },
                  "response": {
                    "type": "object",
                    "properties": {
                      "options": {
                        "type": "object",
                        "properties": {
                          "type": { "type": "string", "description": "value: select" },
                          "values": {
                            "type": "array",
                            "items": {
                              "type": "string"
                            },
                            "description": "add to array: Countertops"
                          }
                        },
                        "required": ["type", "values"],
                        "additionalProperties": false,
                        "description": "Configuración del select para la pregunta"
                      }
                    }
                  }
                },
                "required": ["id", "value", "desc", "response"],
                "additionalProperties": false,
                "description": "Pregunta Countertops"
              },
              "Cabinets": {
                "type": "object",
                "properties": {
                  "id": { "type": "string", "description": "Identificador del item, valor es Cabinets" },
                  "value": { "type": "string", "description": "Valor seleccionado para Cabinets" },
                  "desc": { "type": "string", "description": "Cabinets" },
                  "response": {
                    "type": "object",
                    "properties": {
                      "options": {
                        "type": "object",
                        "properties": {
                          "type": { "type": "string", "description": "value: select" },
                          "values": {
                            "type": "array",
                            "items": {
                              "type": "string"
                            },
                            "description": "add to array: Cabinets"
                          }
                        },
                        "required": ["type", "values"],
                        "additionalProperties": false,
                        "description": "Configuración del select para la pregunta"
                      }
                    }
                  }
                },
                "required": ["id", "value", "desc", "response"],
                "additionalProperties": false,
                "description": "Pregunta Cabinets"
              },
            },
            "required": ["Window Frame", "Door", "Garage", "Fascia Board", "Exterior Wall Cladding", "Brick Detailing", "Roof Covering", "Floor", "Countertops", "Cabinets", "status"],
            "additionalProperties": false,
            "description": "Sección de preguntas hotspotscon status, las preguntas son Window Frame, Door, Garage"
          }
        },
        "required": ["questions", "hotspots"],
        "additionalProperties": false,
        "description": "preguntas hotspots y questions"
      }
    }
  ]
}


interface Question {
  id: string;
  value: string;
  desc: string;
  response: {
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

// Agregar interfaces para Hubspot
interface HubspotSection {
  id: string;
  value: string;
  desc: string;
  response: {
    type: string;
    values: string[];
  };
}

interface HubspotStatus {
  completed: boolean;
  currentSection: string;
  nextSection?: string;
  totalSections: number;
  answeredSections: number;
}

interface Hubspot {
  status?: HubspotStatus;
  interior: HubspotSection;
  exterior: HubspotSection;
  [key: string]: HubspotSection | HubspotStatus | undefined;
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
    this.tools = dialogFlow.tools.map((tool: any) => { // Added type for tool
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
  async queryAIIFrame(text: string, history: any[], flowType: 'questions' | 'hotspots') {
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

    // Validar que el flowType sea válido
    const validFlowTypes = this.getValidFlowTypes();
    if (!validFlowTypes.includes(flowType)) {
      responseForUser.code = 400;
      responseForUser.text = [{ text: `Flujo no válido. Los flujos disponibles son: ${validFlowTypes.join(', ')}` }];
      responseForUser.historyChat.push({
        role: "model",
        parts: [{ text: `Flujo no válido. Los flujos disponibles son: ${validFlowTypes.join(', ')}` }]
      });
      return responseForUser;
    }

    // Verificar si el flujo actual ya está completo
    if (flowType === 'questions' && this.checkQuestionsStatus(history)) {
      const nextFlow = this.getNextFlow(flowType);
      const message = nextFlow
        ? `Has terminado de completar este flujo, gracias. Ahora sigue el flujo ${nextFlow}.`
        : "Has terminado de completar este flujo, gracias. Todos los flujos han sido completados exitosamente.";

      responseForUser.code = 200;
      responseForUser.text = [{ text: message }];
      responseForUser.historyChat.push({
        role: "model",
        parts: [{ text: message }]
      });
      return responseForUser;
    }

    if (flowType === 'hotspots' && this.checkHotspotsStatus(history)) {
      const nextFlow = this.getNextFlow(flowType);
      const message = nextFlow
        ? `Has terminado de completar este flujo, gracias. Ahora sigue el flujo ${nextFlow}.`
        : "Has terminado de completar este flujo, gracias. Todos los flujos han sido completados exitosamente.";

      responseForUser.code = 200;
      responseForUser.text = [{ text: message }];
      responseForUser.historyChat.push({
        role: "model",
        parts: [{ text: message }]
      });
      return responseForUser;
    }

    let systemInstruction = '';
    if (flowType === 'questions') {
      systemInstruction = `Con la información proporcionada, necesito que me ayudes a obtener las respuestas del usuario.
      IMPORTANTE: Debes seguir el orden exacto de las preguntas: q01, q02, q03.
      
      Para cada pregunta:
      - Si no tiene valor, es la sección actual y debes hacerla
      - Si tiene valor, y ademas el valor es difente a hola, hello, none, None, ya fue contestada y puedes pasar a la siguiente
      - Si todas tienen valor, el flujo está completo
      
      NUNCA saltes preguntas. Siempre empieza con q01 si no tiene valor.
      
      IMPORTANTE: Solo responde con el texto de la pregunta o instrucción para el usuario. 
      NO incluyas código, NO muestres la función que estás llamando.
      Solo el texto natural de la pregunta.
      
      Actualiza el status de las preguntas:
      - completed: true si todas las preguntas tienen valor
      - currentQuestion: el uid de la pregunta actual (la primera sin valor en orden q01, q02, q03)
      - nextQuestion: el uid de la siguiente pregunta (si existe)
      - totalQuestions: número total de preguntas en el flujo
      - answeredQuestions: número de preguntas que tienen valor`;
    } else if (flowType === 'hotspots') {
      systemInstruction = `Con la información proporcionada, necesito que me ayudes a obtener las respuestas del usuario para las secciones de hotspots.
      Sigue el orden de las secciones definidas en el schema.
      Para cada sección:
      - Si no tiene valor, es la sección actual y debes hacerla
      - Si tiene valor, ya fue contestada y puedes pasar a la siguiente
      - Si todas tienen valor, el flujo está completo
      
      IMPORTANTE: Solo responde con el texto de la pregunta o instrucción para el usuario. 
      NO incluyas código, NO muestres la función que estás llamando.
      Solo el texto natural de la pregunta.
      
      Actualiza el status de hotspots:
      - completed: true si todas las secciones tienen valor,
      - currentSection: el uid de la sección actual (la primera sin valor),
      - nextSection: el uid de la siguiente sección (si existe),
      - totalSections: número total de secciones en el flujo,
      - answeredSections: número de secciones que tienen valor`;
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
            allowedFunctionNames: ['simple-questions-flow']
          }
        },
        systemInstruction: systemInstruction
      }
    });
    console.log('response1', response1);
    if (response1?.candidates?.[0]?.content?.parts?.[0]?.functionCall) {
      const functionCall = response1.candidates[0].content.parts[0].functionCall;
      console.log('Function Call:', functionCall);

      const toolName = functionCall.name;
      const toolArgs = functionCall.args as ToolArgs;

      console.log('toolArgs:', JSON.stringify(toolArgs, null, 2));

      // Actualizar el status de las preguntas
      if (flowType === 'questions' && toolArgs.questions) {
        const questions = toolArgs.questions;

        // Obtener todas las preguntas en el orden correcto del schema
        const questionKeys = ['q01', 'q02', 'q03']; // Orden específico del schema
        const totalQuestions = questionKeys.length;

        // Contar preguntas contestadas
        const answeredQuestions = questionKeys.filter(key => {
          const question = questions[key] as Question;
          return question && this.isValidValue(question.value);
        }).length;

        // Determinar la pregunta actual siguiendo el orden del schema
        let currentQuestion = '';
        let nextQuestion = '';

        for (let i = 0; i < questionKeys.length; i++) {
          const key = questionKeys[i];
          const question = questions[key] as Question;

          if (!this.isValidValue(question.value)) {
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

        // Limpiar hotspots del toolArgs para evitar interferencias
        if (toolArgs.hotspots) {
          delete toolArgs.hotspots;
        }
      }

      // Actualizar el status de hotspots
      if (flowType === 'hotspots' && toolArgs.hotspots) {
        const hubspot = toolArgs.hotspots as Hubspot;
        // Obtener todas las secciones (excluyendo el status)
        const sectionKeys = Object.keys(hubspot).filter(key => key !== 'status');
        const totalSections = sectionKeys.length;
        // Contar secciones contestadas
        const answeredSections = sectionKeys.filter(key => {
          const section = hubspot[key] as HubspotSection;
          return section && this.isValidValue(section.value);
        }).length;
        // Determinar la sección actual y la siguiente
        let currentSection = '';
        let nextSection = '';
        for (let i = 0; i < sectionKeys.length; i++) {
          const key = sectionKeys[i];
          const section = hubspot[key] as HubspotSection;
          if (!this.isValidValue(section.value)) {
            currentSection = key;
            nextSection = sectionKeys[i + 1] || '';
            break;
          }
        }
        // Si no hay sección actual, significa que todas están contestadas
        if (!currentSection && sectionKeys.length > 0) {
          currentSection = sectionKeys[sectionKeys.length - 1];
        }
        hubspot.status = {
          completed: answeredSections === totalSections,
          currentSection,
          nextSection,
          totalSections,
          answeredSections
        };

        // Limpiar questions del toolArgs para evitar interferencias
        if (toolArgs.questions) {
          delete toolArgs.questions;
        }
      }

      const response2 = await chat.sendMessage({
        message: JSON.stringify(toolArgs),
        config: {
          systemInstruction: flowType === 'questions'
            ? `Con la información proporcionada, necesito que me ayudes a obtener las respuestas del usuario.
               IMPORTANTE: Debes seguir el orden exacto de las preguntas: q01, q02, q03.
               
               Para cada pregunta:
               - Si no tiene valor, es la pregunta actual y debes hacerla
               - Si tiene valor, y ademas el valor es difente a hola, hello, none, None, ya fue contestada y puedes pasar a la siguiente
               - Si todas tienen valor, el flujo está completo
               
               NUNCA saltes preguntas. Siempre empieza con q01 si no tiene valor.
               
               IMPORTANTE: Solo responde con el texto de la pregunta o instrucción para el usuario. 
               NO incluyas código, NO muestres la función que estás llamando.
               Solo el texto natural de la pregunta.
               
               Actualiza el status de las preguntas:
               - completed: true si todas las preguntas tienen valor
               - currentQuestion: el uid de la pregunta actual (la primera sin valor en orden q01, q02, q03)
               - totalQuestions: número total de preguntas en el flujo
               - answeredQuestions: número de preguntas que tienen valor`
            : `Con la información proporcionada, necesito que me ayudes a obtener las respuestas del usuario para las secciones de hotspots.
               Sigue el orden de las secciones definidas en el schema.
               
               IMPORTANTE: Solo responde con el texto de la pregunta o instrucción para el usuario. 
               NO incluyas código, NO muestres la función que estás llamando.
               Solo el texto natural de la pregunta.
               
               Actualiza el status de hotspots:
               - completed: true si todas las secciones tienen valor,
               - currentSection: el uid de la sección actual (la primera sin valor),
               - nextSection: el uid de la siguiente sección (si existe),
               - totalSections: número total de secciones en el flujo,
               - answeredSections: número de secciones que tienen valor`,
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingConfigMode.ANY,
              allowedFunctionNames: ['simple-questions-flow']
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
        // Limpiar el texto de la respuesta para remover código de función
        let cleanText = response2.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Remover código de función si está presente
        if (cleanText.includes('```tool_code') || cleanText.includes('print(')) {
          // Extraer solo la parte del texto antes del código
          const textParts = cleanText.split('```');
          if (textParts.length > 0) {
            cleanText = textParts[0].trim();
          }
        }

        // Verificar si el flujo actual se completó y agregar mensaje de transición
        if (flowType === 'questions' && toolArgs.questions?.status?.completed) {
          const nextFlow = this.getNextFlow(flowType);
          const transitionMessage = nextFlow
            ? `\n\nHas terminado de completar este flujo, gracias. Ahora sigue el flujo ${nextFlow}.`
            : "\n\nHas terminado de completar este flujo, gracias. Todos los flujos han sido completados exitosamente.";
          cleanText += transitionMessage;
        } else if (flowType === 'hotspots' && toolArgs.hotspots?.status?.completed) {
          const nextFlow = this.getNextFlow(flowType);
          const transitionMessage = nextFlow
            ? `\n\nHas terminado de completar este flujo, gracias. Ahora sigue el flujo ${nextFlow}.`
            : "\n\nHas terminado de completar este flujo, gracias. Todos los flujos han sido completados exitosamente.";
          cleanText += transitionMessage;
        }

        responseForUser.code = 200;
        responseForUser.historyChat.push({
          role: 'model',
          parts: [{ text: cleanText }]
        });
        responseForUser.text = [{ text: cleanText }];
        responseForUser.question = [toolArgs]

        return responseForUser;
      }

    } else if (response1?.candidates?.[0]?.content?.parts?.[0]?.text) {
      // Limpiar el texto de la respuesta para remover código de función
      let cleanText = response1.candidates[0].content.parts[0].text;

      // Remover código de función si está presente
      if (cleanText.includes('```tool_code') || cleanText.includes('print(')) {
        // Extraer solo la parte del texto antes del código
        const textParts = cleanText.split('```');
        if (textParts.length > 0) {
          cleanText = textParts[0].trim();
        }
      }

      responseForUser.code = 200;
      responseForUser.text = [{ text: cleanText }];
      responseForUser.historyChat.push({
        role: "model",
        parts: [{ text: cleanText }]
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

  // Métodos auxiliares para verificar el estado de los flujos
  private getValidFlowTypes(): string[] {
    return ['questions', 'hotspots'];
  }

  private getNextFlow(currentFlow: string): string | null {
    const validFlows = this.getValidFlowTypes();
    const currentIndex = validFlows.indexOf(currentFlow);
    if (currentIndex >= 0 && currentIndex < validFlows.length - 1) {
      return validFlows[currentIndex + 1];
    }
    return null;
  }

  private checkQuestionsStatus(history: any[]): boolean {
    // Buscar en el historial si questions ya está completado
    for (let i = history.length - 1; i >= 0; i--) {
      const message = history[i];
      if (message.role === 'model' && message.parts) {
        for (const part of message.parts) {
          if (part.functionCall && part.functionCall.name === 'simple-questions-flow') {
            const args = part.functionCall.args as ToolArgs;
            if (args.questions && args.questions.status) {
              const status = args.questions.status as QuestionsStatus;
              // Verificar que realmente todas las preguntas tengan valores válidos
              if (status.completed === true) {
                const questionKeys = ['q01', 'q02', 'q03'];
                const allQuestionsValid = questionKeys.every(key => {
                  const question = args.questions?.[key] as Question;
                  return question && this.isValidValue(question.value);
                });
                return allQuestionsValid;
              }
            }
          }
        }
      }
    }
    return false;
  }

  private checkHotspotsStatus(history: any[]): boolean {
    // Buscar en el historial si hotspots ya está completado
    for (let i = history.length - 1; i >= 0; i--) {
      const message = history[i];
      if (message.role === 'model' && message.parts) {
        for (const part of message.parts) {
          if (part.functionCall && part.functionCall.name === 'simple-questions-flow') {
            const args = part.functionCall.args as ToolArgs;
            if (args.hotspots && args.hotspots.status) {
              const status = args.hotspots.status as HubspotStatus;
              // Verificar que realmente todas las secciones tengan valores válidos
              if (status.completed === true) {
                const sectionKeys = Object.keys(args.hotspots).filter(key => key !== 'status');
                const allSectionsValid = sectionKeys.every(key => {
                  const section = args.hotspots[key] as HubspotSection;
                  return section && this.isValidValue(section.value);
                });
                return allSectionsValid;
              }
            }
          }
        }
      }
    }
    return false;
  }

  // Función para validar si un valor es válido (no vacío y no es un valor placeholder)
  private isValidValue(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    const trimmedValue = value.trim().toLowerCase();
    const invalidValues = ['none', 'hello', 'hola', '', 'null', 'undefined'];

    return !invalidValues.includes(trimmedValue);
  }

};


export const AI = () => {



}
