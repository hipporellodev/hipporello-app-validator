import AbstractHippoNode from "../AbstractHippoNode";
import { TransText } from "../../localize/localize";

export default class MagicLinkExecuterNode extends AbstractHippoNode {
  constructor(appJson, path, magicLinkExecuterObject) {
    super(appJson, path);
    this.magicLinkExecuterObject = magicLinkExecuterObject;
  }

  getValidatorFunction({ label }) {
    const { id } = this.magicLinkExecuterObject || {};
    if (id && !this.appJson?.app?.fieldDefinitions?.magicLink?.[id]) {
      return [
        {
          path: this.path,
          type: "invalidMagicLinkDefinition",
          actual: id,
          message: TransText.getTranslate(
            "magicLinkDefinitionDeletedWithLabel",
            label
          ),
        },
      ];
    }
    return null;
  }
}
