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
            field: {
              type: "object",
              properties: {
                type: "string",
                resolveBy: "string|optional",
                markAsLoggedInUser: "boolean|optional",
              },
            },
            paramType: {
              type: "enum",
              values: ["onlySpecified", "valueOnCreate"],
            },
            value: {
              type: "custom",
              check: (value, errors, schema, path, parent) => {
                if (
                  parent.paramType === "onlySpecified" &&
                  value === "[[[nullValue]]]"
                ) {
                  errors.push({
                    type: "required",
                    field: path,
                    message:
                      "Value is required when paramType is onlySpecified",
                  });
                }

                if (value && value !== "[[[nullValue]]]") {
                  if (
                    !value.valueType ||
                    !["value", "variable"].includes(value.valueType)
                  ) {
                    errors.push({
                      type: "enumValue",
                      field: `${path}.valueType`,
                      expected: ["value", "variable"],
                    });
                  }

                  if (
                    value.value &&
                    Array.isArray(value.value) &&
                    value.valueType === "value" &&
                    Object.values(value.value).length !== value.value.length
                  ) {
                    errors.push({
                      type: "required",
                      field: `${path}.value`,
                      message: TransText.getTranslate("itemsNotBeEmpty"),
                    });
                  }
                }

                return value;
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
      ...this.nodeJson,
      parameters: this.nodeJson?.parameters
        ? this.nodeJson?.parameters.map((it) => ({
            ...it,
            value: it?.value || "[[[nullValue]]]",
          }))
        : null,
    });
    return Array.isArray(errors) ? errors : [];
  }
}
