import AbstractHippoNode from "../AbstractHippoNode";
import Validator from "fastest-validator";

export default class CollectionNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
    this.initialValidate = false;
  }
  process(appJson, path, nodeJson) {
  }
  getValidatorFunction() {
    const errors = [];
    const json = this.getCollectionValidateJson();
    json.collections.optional = false;
    const collectionChecker = new Validator().compile(json)
    errors.pushArray(collectionChecker(this?.nodeJson||{}))
    return errors
  }
}