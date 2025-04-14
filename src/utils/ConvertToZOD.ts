import { json } from '../db/db.js';
import { boolean, z, ZodArray } from "zod"; 

const convertJSON = () => {

}

const convertArray = () => {

}

const switchTypeInput = (options:{ [key: string]: any }) => {


  const arrayKey = Object.keys(options);

  const optionsZod:any = {};
  for (let i = 0; i < arrayKey.length; i++) {
    const key = arrayKey[i];
    const dataObject = options[key];
    const { type } = dataObject;

    // console.log('---', key, options, arrayKey);

    if(type === 'inputText'){
      optionsZod[key] = z.object({
        type: z.string().describe('inputText'),
        value: z.string().describe(''),
        text: z.string().describe('name'),
      })
    }

    if(type === 'botton'){
      optionsZod[key] = z.object({
        type: z.string().describe('botton'),
        value: z.string().describe(dataObject.value),
        text: z.string().describe(dataObject.text),
      })
    }

    if(type === 'range'){
      optionsZod[key] = z.object(
        {
          type: z.string().describe('range'),
          min: z.number().describe(`min-${dataObject.min}`),
          max: z.number().describe(`max-${dataObject.max}`),
          value: z.number().describe(`${dataObject.value}`),
          text: z.string().describe(dataObject.text),
        }
      )
    }

  }

  return optionsZod;

}

export const ConverToZOD = () => {

  const ZOD:any = {};

  const { title, nameTool, systemInstruction, questions } = json;

  ZOD.title = z.string().describe(title);
  ZOD.nameTool = z.string().describe(nameTool);
  ZOD.systemInstruction = z.string().describe(systemInstruction);

  const questionZod:any = {};

  for (let i = 0; i < questions.length; i++) {

    const jsonNameQuestion:any = questions[i];

    Object.keys(jsonNameQuestion).map((key:string) => {

      const { uid, type, describe, options } = jsonNameQuestion[key];

      questionZod[key] = z.object(
        {
          uid: z.string().describe(uid),
          type: z.string().describe(type),
          active: z.boolean().describe('If value is empty or 0, make true else false'),
          value: type === 'string' ? z.string().describe(''): z.number().describe('value in zero'),
          describe: z.string().describe(describe),
          options: switchTypeInput(options)
        }
      )

    });

    ZOD.questions = z.object(questionZod);
    
  }

  return ZOD;

}

export const GetOnlyQuestions = () => {

  const ZOD:any = {};

  const { title, nameTool, systemInstruction, questions } = json;

  ZOD.title = z.string().describe(title);
  ZOD.nameTool = z.string().describe(nameTool);
  ZOD.systemInstruction = z.string().describe(systemInstruction);

  const questionZod:any = {};

  for (let i = 0; i < questions.length; i++) {

    const jsonNameQuestion:any = questions[i];

    Object.keys(jsonNameQuestion).map((key:string) => {

      const { uid, type, describe, options } = jsonNameQuestion[key];

      questionZod[key] = z.object(
        {
          uid: z.string().describe(uid),
          type: z.string().describe(type),
          active: z.boolean().describe('If value is empty or 0, make true else false'),
          value: type === 'string' ? z.string().describe(''): z.number().describe('value in zero'),
          describe: z.string().describe(describe),
          options: z.object(switchTypeInput(options))
        }
      )

    });

    ZOD.questions = z.object(questionZod);
    
  }

  return questionZod;

}