export const conditionValueCheckFunc = (value, errors, schema, path, parentNode) => {
  if(!["empty", "notempty"].includes(parentNode?.operator)){
    if(value === "[[[nullValue]]]" && parentNode?.valueType === "value"){
      errors.push({type: "required"})
    }
  }
  return value
}