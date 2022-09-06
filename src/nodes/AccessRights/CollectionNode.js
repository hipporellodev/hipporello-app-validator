import AbstractHippoNode from "../AbstractHippoNode";
import Validator from "fastest-validator";

export default class CollectionNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }
  process(appJson, path, nodeJson) {
  }
  getValidatorFunction() {
    const errors = [];
    const collectionChecker = new Validator().compile(this.getCollectionValidateJson())
    errors.pushArray(collectionChecker(this?.nodeJson||{}))
    return errors
  }
}