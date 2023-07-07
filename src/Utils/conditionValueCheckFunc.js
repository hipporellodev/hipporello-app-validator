import VariableNode from "../nodes/VariableNode";

export function conditionValueCheckFunc(appJson, entries, value, errors, schema, path, parentNode){
  if(!["empty", "notempty"].includes(parentNode?.operator)){
    if(value === "[[[nullValue]]]" && parentNode?.valueType === "value"){
      errors.push({type: "required"})
    }
    else if(parentNode?.valueType === "value" && value){
      const field = parentNode?.field;
      const searchField = field.replace(/\.(hippoId|id)$/g, "")
      const node = new VariableNode(appJson, "", searchField)
      node.init(null, entries)
      const enums =  node.getRightValues()
      if(enums != null){
        let hasError = false;
        if(Array.isArray(value)) hasError = !value.every((i) => enums.includes(i))
        else hasError = !enums.includes(value)
        if (hasError){
          errors.push({type: "enumValue", label: node.createMustacheLabel(node.getRightValueEntityName()), value, expected: enums})
        }
      }
    }
  }
  return value
}