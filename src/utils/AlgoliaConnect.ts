import { algoliasearch } from "algoliasearch";

const client = algoliasearch('5WEGK1QY4E', '8df8e55bc82b699d19038a0fa007f3d7');

export const makeLLMAlgoliaRequest = async (toolArgs: Record<string, unknown> | undefined) => {


  const responseError: { type: 'text', text: string}[] = [{
    type: 'text',
    text: 'Algo ha salido mal al encontrar tu casa'
  }]

  if (toolArgs) {
    if (
      Object.hasOwn(toolArgs, 'questionBedsJSON') &&
      Object.hasOwn(toolArgs, 'questionLocationJSON') &&
      Object.hasOwn(toolArgs, 'questionGarageJSON')
    ) {

      const { questionBedsJSON, questionLocationJSON, questionGarageJSON } = toolArgs as {[x:string]: {value: number | string}};

      console.log('json question', questionBedsJSON.value, questionLocationJSON.value, questionGarageJSON.value);

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

      const r = await client.search({
        requests: [
          {
            indexName: 'test-algolia',
            query: `Phoenix`,
            filters: `_origin.division.name:Phoenix`,
            numericFilters: [
              `specs.minBed:${2} TO ${4}`,
              `specs.minGarage:${1} TO ${3}`
            ]
          }
        ]
      })

      console.log('algolia response', r);

      // @ts-ignore
      const { hits } = r.results[0];

      const listOfHouse: { type: 'text', text: string }[] = hits.map((lot: any) => {

        const specs = JSON.stringify(lot.specs);

        return {
          type: "text",
          text: `Encontramos en la siguiente comunidad ${lot._origin.community.name}, en la ciudad de ${lot._origin.division.name}, con las siguientes specs: ${specs}`,
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