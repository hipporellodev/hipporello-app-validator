import {conditionValueCheckFunc} from "./conditionValueCheckFunc";
import {OPERATORS} from "../constants";
import getValidator from "./getValidator";

 export const conditionsWithAnd = (appJson, entries) => {
   return getValidator({useNewCustomCheckerFunction: true}).compile({
     conditions: {
       type: 'array',
       optional: true,
       items: {
         type: 'array',
         items: {
           type: 'object',
           props: {
             field: 'string|empty:false',
             operator: {
               type: 'enum',
               values: OPERATORS
             },
             value: {
               type: "custom",
               nullable: true,
               default: "[[[nullValue]]]",
               check: conditionValueCheckFunc.bind(this, appJson, entries)
             },
             valueType: {
               type: 'enum',
               values: ["variable", "value"]
             }
           }
         }
       }
     }
   })
 }