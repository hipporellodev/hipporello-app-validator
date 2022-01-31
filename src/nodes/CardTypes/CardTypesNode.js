import AbstractHippoNode from "../AbstractHippoNode";
import CardTypeNode from "../CardTypes/CardTypeNode";
import JSONUtils from "../../JSONUtils";

export default class CardTypesNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  process(appJson, path, nodeJson) {
    let cardTypes = JSONUtils.query(appJson, "app.cardTypes");
    if(cardTypes){
      cardTypes = Object.values(cardTypes)
      cardTypes.forEach(cardType=>{
        this.addChildNode(new CardTypeNode(appJson, "app.cardTypes."+cardType.id))
      })
    }
  }
}
