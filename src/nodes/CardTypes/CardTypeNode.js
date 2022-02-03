import AbstractHippoNode from "../AbstractHippoNode";
import Validator from "fastest-validator";

const cardTypesSchema = {
  id: 'string',
  name: 'string'
}
const cardTypeCheck = new Validator().compile(cardTypesSchema);
export default class CardTypeNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  process(appJson, path, nodeJson) {
  }

  getValidatorFunction() {
    return cardTypeCheck;
  }
}
