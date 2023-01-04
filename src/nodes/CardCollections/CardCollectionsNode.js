import AbstractHippoNode from "../AbstractHippoNode";
import CardCollectionNode from "../CardCollections/CardCollectionNode";
import JSONUtils from "../../JSONUtils";

export default class CardCollectionsNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  process(appJson, path, nodeJson) {
    let cardCollectionIds = this.getCollections()
    if(cardCollectionIds){
      cardCollectionIds.forEach(cardCollectionId=>{
        this.addChildNode(new CardCollectionNode(appJson, "app.cardCollections." + cardCollectionId))
      })
    }
  }
  getValidatorFunction() {
    if (typeof this.nodeJson !== 'object') {
      return [
          this.createValidationError('object', 'cardCollections', typeof this.nodeJson)
      ]
    }
  }

  isMandatory() {
    return false;
  }
}
