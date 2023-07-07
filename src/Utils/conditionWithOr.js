import Validator from "fastest-validator";
import {conditionValueCheckFunc} from "./conditionValueCheckFunc";
import {OPERATORS} from "../constants";

 export const conditionsWithOr = (appJson, entries) => new Validator({useNewCustomCheckerFunction: true}).compile({
  conditions: {
    type: 'array',
    optional: true,
    items: {
      type: 'array',
      items: {
        type: "object",
        props: {
          field: 'string|empty:false',
          operator: {
            type: 'enum',
            values: OPERATORS
          },
          value: {
            type: 'custom',
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
