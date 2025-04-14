export const json = {
  "title": "Search house",
  "nameTool": "start-recommendation-flow",
  "systemInstruction": "Con la ayuda de la tool star-recommendation-flow brindada, necesito que me vayas guiando con las preguntas para poder encontrar un hogar, haz una pregunta a la vez. Luego usa la tool para mandar llamar la api de algolia",
  "questions": [
    {
      "questionNameJSON": {
        "uid": "q01",
        "type": "string",
        "describe": "Añade al array los string, 'guess' y 'friend'",
        "options": {
          "inputName": {
            "type": "inputText",
            "value": "",
            "text": "name"
          },
          "bottonGuess": {
            "type": "botton",
            "value": "Guess",
            "text": "Guess"
          },
          "buttonFriend": {
            "type": "botton",
            "value": "Friend",
            "text": "Friend"
          }
        }
      },
      "questionLocationJSON": {
        "uid": "q02",
        "type": "string",
        "describe": "Añade al array los string, 'guess' y 'friend'",
        "options": {
          "buttonPhoenix": {
            "type": "botton",
            "value": "Phoenix",
            "text": "Phoenix"
          },
          "buttonAustion": {
            "type": "botton",
            "value": "Austin",
            "text": "Austin"
          },
          "buttonVegas": {
            "type": "botton",
            "value": "Las Vegas",
            "text": "Las Vegas"
          }
        }
      },
      "questionBedsJSON": {
        "uid": "q03",
        "type": "number",
        "describe": "Añade al array los string, 'guess' y 'friend'",
        "options": {
          "rangeBed": {
            "type": "range",
            "min": 1,
            "max": 20,
            "value": 2,
            "text": "bed"
          }
        }

      },
      "questionGarageJSON": {
        "uid": "q04",
        "type": "number",
        "describe": "Añade al array los string, 'guess' y 'friend'",
        "options": {
          "rangeGarage": {
            "type": "range",
            "min": 1,
            "max": 20,
            "value": 2,
            "text": "garages"
          }
        }
      }
    }
  ]
}