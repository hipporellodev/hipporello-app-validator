import AbstractHippoNode from "../AbstractHippoNode";
import getValidator from "../../Utils/getValidator";
import { TransText } from "../../localize/localize";

export default class MagicLinkNode extends AbstractHippoNode {
  constructor(appJson, path) {
    super(appJson, path);
  }

  getValidatorFunction() {
    const magicLinkCheck = getValidator({
      useNewCustomCheckerFunction: true,
    }).compile({
      id: "string|empty:false",
      name: "string|empty:false|trim",
      requirePrompt: "boolean|optional",
      promptLabel: {
        type: "custom",
        check: (value, errors, schema, path, parentNode) => {
          console.log("promptLabel", {
            value,
            errors,
            schema,
            path,
            parentNode,
          });
          if (parentNode?.requirePrompt === true) {
            if (!value) {
              errors.push({ type: "required", field: "promptLabel" });
            } else if (value?.length > 100) {
              errors.push({
                type: "stringLength",
                field: "promptLabel",
                message: TransText.getTranslate("magicLinkModalPromptMax"),
              });
            }
          }
          return value;
        },
      },
      expireEnabled: "boolean|optional",
      expires: {
        type: "custom",
        nullable: true,
        check: (value, errors, schema, path, parentNode) => {
          if (parentNode.expireEnabled === true) {
            if (!value) {
              errors.push({ type: "required", field: "expires" });
            } else if (value < 1) {
              errors.push({
                type: "numberMin",
                field: "expires",
                message: TransText.getTranslate("magicLinkModalExpiresMin", 1),
              });
            } else if (value > 100) {
              errors.push({
                type: "numberMax",
                field: "expires",
                message: TransText.getTranslate(
                  "magicLinkModalExpiresMax",
                  100
                ),
              });
            }
          }
          return value;
        },
      },
      parameters: {
        type: "array",
        optional: true,
        items: {
          type: "object",
          props: {
            id: "string|empty:false",
            name: "string|empty:false|trim",
            fieldType: "string|empty:false",
            paramType: {
              type: "enum",
              values: ["onlySpecified", "valueOnCreate"],
            },
            value: {
              type: "object",
              props: {
                valueType: {
                  type: "enum",
                  optional: true,
                  values: ["value", "variable"],
                },
                value: {
                  type: "custom",
                  check: (
                    value,
                    errors,
                    schema,
                    path,
                    parentNode,
                    rootNode
                  ) => {
                    if (rootNode.paramType === "onlySpecified" && !value) {
                      errors.push({ type: "required", field: "value" });
                    }
                    const hasEmptyItem = Array.isArray(value)
                      ? Object.values(value).length !== value.length
                      : false;
                    if (hasEmptyItem && parentNode?.valueType === "value") {
                      errors.push({
                        type: "required",
                        field: "value",
                        message: TransText.getTranslate("itemsNotBeEmpty"),
                      });
                    }
                    return value;
                  },
                },
              },
            },
          },
        },
      },
    });
    const errors = magicLinkCheck({
      promptLabel: "",
      requirePrompt: false,
      expireEnabled: false,
      expires: null,
      parameters: null,
      ...this.nodeJson,
    });
    console.log(this.nodeJson, errors);
    return Array.isArray(errors) ? errors : [];
  }
}
