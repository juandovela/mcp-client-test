import { algoliasearch } from "algoliasearch";

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

const client = algoliasearch('5WEGK1QY4E', '8df8e55bc82b699d19038a0fa007f3d7');

export const makeLLMAlgoliaRequest = async (toolArgs: Record<string, unknown> | undefined) => {


  const responseError: { type: 'text', text: string}[] = [{
    type: 'text',
    text: 'Algo ha salido mal al encontrar tu casa'
  }]

  if (true) {
    // if (
    //   Object.hasOwn(toolArgs, 'questionBedsJSON') &&
    //   Object.hasOwn(toolArgs, 'questionLocationJSON') &&
    //   Object.hasOwn(toolArgs, 'questionGarageJSON')
    // ) {
    if(true){

      // const { questionBedsJSON, questionLocationJSON, questionGarageJSON } = toolArgs as {[x:string]: {value: number | string}};

      // console.log('json question', questionBedsJSON.value, questionLocationJSON.value, questionGarageJSON.value);

      // const r = await client.search({
      //   requests: [
      //     {
      //       indexName: 'test-algolia',
      //       query: `${questionLocationJSON.value}`,
      //       filters: `_origin.division.name:${questionLocationJSON.value}`,
      //       numericFilters: [
      //         `specs.minBed:${(typeof questionGarageJSON.value === 'number' ) ? questionGarageJSON.value : 2 - 1} TO ${ (typeof questionGarageJSON.value === 'number' ) ? questionGarageJSON.value : 2 + 1}`,
      //         `specs.minGarage:${(typeof questionBedsJSON.value === 'number' ) ? questionBedsJSON.value : 3 - 1} TO ${(typeof questionBedsJSON.value === 'number' ) ? questionBedsJSON.value : 3 + 1}`
      //       ]
      //     }
      //   ]
      // })

      // const r = await client.search({
      //   requests: [
      //     {
      //       indexName: 'test-algolia',
      //       query: `Phoenix`,
      //       filters: `_origin.division.name:Phoenix`,
      //       numericFilters: [
      //         `specs.minBed:${2} TO ${4}`,
      //         `specs.minGarage:${1} TO ${3}`
      //       ]
      //     }
      //   ]
      // })

      // console.log('algolia response', r);

      // // @ts-ignore
      // const { hits } = r.results[0];

      const hits = communities;

      const listOfHouse: { type: 'text', text: string }[] = hits.map((lot:any) => {

        const specs = JSON.stringify(lot.amenities);

        return {
          type: "text",
          text: `Encontramos en las siguiente comunidades ${lot._origin.community.name}, con el UID ${lot._origin.community.uid}, en la ciudad de ${lot._origin.division.name}, con las siguientes amenidades: ${specs}`,
        }
      })

      return listOfHouse;
    } else {
      return responseError
    }


  } else {
    return responseError
  }


}