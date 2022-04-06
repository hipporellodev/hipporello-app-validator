import AbstractHippoNode from "../AbstractHippoNode";
import CardCollectionNode from "../CardCollections/CardCollectionNode";
import JSONUtils from "../../JSONUtils";

export default class CardCollectionsNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  process(appJson, path, nodeJson) {
    let cardCollections = JSONUtils.query(appJson, "app.cardCollections");
    if(cardCollections){
      cardCollections = Object.values(cardCollections)
      cardCollections.forEach(cardCollection=>{
        this.addChildNode(new CardCollectionNode(appJson, "app.cardCollections."+cardCollection.id))
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
