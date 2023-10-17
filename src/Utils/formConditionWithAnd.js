import Validator from "fastest-validator";
import HippoValidator from "../HippoValidator";
import getValidator from "./getValidator";

export const formConditionsWithAnd = getValidator().compile({
  conjunction: {
    type: "enum",
    values: ['AND', 'OR', "NOR"]
  },
  rules: {
    type: 'array',
    optional: true,
  }
})
export const formConditionRule = getValidator({useNewCustomCheckerFunction: true}).compile({
  field: 'string|empty:false',
  operator: {
    type: 'enum',
    values: [
      "equal",
      "not_equal",
      "less",
      "less_or_equal",
      "greater",
      "greater_or_equal",
      "between",
      "not_between",
      "select_equals",
      "select_not_equals",
      "select_not_any_in",
      "any_in",
      "not_any_in",
      "multiselect_equals",
      "multiselect_not_equals",
      "is_empty",
      "is_not_empty",
      "select_any_in",
    ]
  },
  value: {
    type: "custom",
    default: "[[[nullValue]]]",
    custom(v, errors, schema, path, parentNode, context) {
      const {operator, value} = context?.data || {};
      const isEmptyValue = HippoValidator.isEmpty(value)
      if(!["is_empty", "is_not_empty"].includes(operator)){
        if(value === "[[[nullValue]]]" || isEmptyValue){
          errors.push({type: "required"})
        }
      }
      return value
    }
  }
})