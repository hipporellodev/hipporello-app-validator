import AbstractHippoNode from "../AbstractHippoNode";
import Validator from "fastest-validator";

const cardCollectionSchema = {
  id: 'string',
  name: 'string',
  collections:{
    type:"array",
    optional:true,
    items:{
      type:"string"
    }
  },
  conditions:{
    type:"array",
    optional:true
  }
}
const cardCollectionCheck = new Validator().compile(cardCollectionSchema);
export default class CardCollectionNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  process(appJson, path, nodeJson) {
  }

  getValidatorFunction() {
    return cardCollectionCheck;
  }
}
