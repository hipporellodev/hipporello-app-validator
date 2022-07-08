import Validator from "fastest-validator";
import {conditionValueCheckFunc} from "./conditionValueCheckFunc";

 export const conditionsWithAnd = new Validator({useNewCustomCheckerFunction: true}).compile({
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
            values: [
              "equals",
              "notequals",
              "contains",
              "notcontains",
              "startswith",
              "notstartswith",
              "endswith",
              "notendswith",
              "lessthan",
              "lessthanequals",
              "greaterthan",
              "greaterthanequals",
              "in",
              "allin",
              "anyin",
              "notin",
              "empty",
              "notempty",
              "has",
              "doesnthave",
            ]
          },
          value: {
            type: "custom",
            nullable: true,
            default: "[[[nullValue]]]",
            check: conditionValueCheckFunc
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