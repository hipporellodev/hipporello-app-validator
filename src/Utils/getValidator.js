import Validator from "fastest-validator";
import {TransText} from "../localize/localize";

export default (others) => {
  const languageString = TransText.getLanguageString(TransText.getLanguage())
  const messages = Object.entries(languageString).reduce((acc, [key, text]) => {
    if(key.startsWith('validate.')) {
      const newKey = key.replace("validate.", "")
      acc[newKey] = text
    }
    return acc
  }, {})
  return new Validator({
    ...others,
    messages: {
      ...(others?.messages),
      ...messages
    }
  })
}