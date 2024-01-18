import AbstractHippoNode from "../AbstractHippoNode";
import ActionGroupNode from "../ActionGroupNode";
import { FORM_INPUT_NAMES } from "../../Utils/formInputNames";
import FormInputVisibilityNode from "./FormInputVisibilityNode";
import uniq from "lodash/uniq";
import getValidator from "../../Utils/getValidator";
import {TransText} from "../../localize/localize";

const formInputSchema = {
  input: "string",
  id: "string|empty:false",
  props: {
    type: "object",
    props: {
      value: "string|optional",
      label: "string|optional",
      name: "string",
      settings: "any|optional",
    },
  },
};
function fieldSelectorCheck(validationRulesScheme) {
  const isSelectedFields = this?.nodeJson?.props?.elementData?.include?.dataFields?.source === "direct";
  const isVariableField = this?.nodeJson?.props?.elementData?.include?.dataFields?.source === "variable";
  let fields = []
  fields = this.getHippoFields(true);
  fields = fields.concat(this.getCustomFields(true))
  fields = fields.concat(this.getAppParameters(true))
  fields = fields.concat(['hippoFields', "customFields", "appVariables"])
  return getValidator().compile({
    label: "string|optional",
    name: "string",
    schema: "object",
    settings: "object",
    validationRules: validationRulesScheme,
    elementData: {
      type: "object",
      props: {
        include: {
          type: "object",
          props: {
            dataFields: {
              type: "object",
              label: TransText.getTranslate('dataFields'),
              props: {
                source: {
                  type: "enum",
                  values: ["direct", "variable"],
                },
                variable: {
                  type: "string",
                  optional: !isVariableField,
                  label: "Variable",
                },
                selected: {
                  type: "array",
                  optional: !isSelectedFields,
                  label: TransText.getTranslate('dataFields'),
                  minItems: isSelectedFields ? 1 : 0,
                  items: {
                    type: "enum",
                    values: fields,
                  },
                  messages: {
                    required: TransText.getTranslate('xSelectorNoAnySelectedOption', TransText.getTranslate('field'), "Field Selector"),
                  },
                },
              }
            }
          },
        },
        fields: "array",
      },
    },
  })
}
const formInputCheck = getValidator().compile(formInputSchema);
export default class FormInputNode extends AbstractHippoNode {
  constructor(appJson, path, id, formJson) {
    super(appJson, path);
    this.id = id;
    this.formJson = formJson;
  }

  process(appJson, path, nodeJson) {
    if (
      nodeJson?.input === "Button" &&
      nodeJson?.props?.["optional-actionGroupId"]
    ) {
      const actionGroupId = nodeJson?.props?.["optional-actionGroupId"];
      this.addChildNode(
        new ActionGroupNode(appJson, "app.actionGroups." + actionGroupId)
      );
    }
    if (nodeJson.props?.visibilityRules?.rules?.length) {
      this.addChildNode(
        new FormInputVisibilityNode(
          appJson,
          `${this.path}.props.visibilityRules`
        )
      );
    }
  }

  getValidatorFunction() {
    let hasParent =
      this?.parentNode?.nodeJson?.type === "updateform" ||
      this?.parentNode?.nodeJson?.usesParent;
    const formMapping = this.parentNode.nodeJson.body.fieldMapping || {};
    for (const formMappingKey in formMapping) {
      if (
        formMapping[formMappingKey]?.["cardField"]?.targetField ===
        "c_parentCardId"
      ) {
        hasParent = true;
      }
    }
    const trelloListIds = this.getTrelloList(true, hasParent);
    let isNameOptional = false;
    let isListOptional = false;
    const fieldMapping = this?.parentNode?.nodeJson?.body?.fieldMapping;
    Object.values(fieldMapping || {}).forEach((fieldMap) => {
      if (
        fieldMap?.trelloCardField &&
        fieldMap.trelloCardField?.targetField === "name"
      ) {
        isNameOptional = true;
      }
      if (
        fieldMap?.trelloCardField &&
        fieldMap.trelloCardField?.targetField === "list"
      ) {
        isListOptional = true;
      }
    });
    const isLengthIf = ["lengthLimit", "attachmentLimit"].some(i => this.nodeJson?.props?.validationRules?.[i] === true)
    const validationRulesScheme = {
      type: "object",
      optional: true,
      props: {
        required: {
          type: "boolean",
          optional: true,
        },
        minLength: {
          type: "number",
          optional: !isLengthIf,
          nullable: true,
          min: 0,
          max: isLengthIf ? this.nodeJson?.props?.validationRules?.maxLength : 999999,
          label: TransText.getTranslate('minimum'),
        },
        maxLength: {
          type: "number",
          optional: true,
          nullable: true,
          min: isLengthIf ? this.nodeJson?.props?.validationRules?.minLength : 0,
          label: TransText.getTranslate('maximum')
        },
        fileSizeLimit: {
          type: 'boolean',
          optional: true,
          nullable: true,
          label: TransText.getTranslate('attachmentType')
        },
        sizeLimit: {
          type: "number",
          optional: this.nodeJson?.props?.validationRules?.fileSizeLimit !== true,
          label: TransText.getTranslate('maxSize'),
          min: 1,
        },
        lengthLimit: {
          type: 'boolean',
          optional: true,
          nullable: true,
        },
        attachmentLimit: {
          type: 'boolean',
          optional: true,
          nullable: true,
          label: TransText.getTranslate('attachmentSizeLimit')
        },
        minItems: {
          type: "number",
          optional: true,
          nullable: true,
          min: 1,
          max: this.nodeJson?.props?.validationRules?.maxItems,
          label: TransText.getTranslate('minimum'),
        },
        maxItems: {
          type: "number",
          optional: true,
          nullable: true,
          min: this.nodeJson?.props?.validationRules?.minItems,
          label: TransText.getTranslate('maximum'),
        }
        // ,
        // attachmentTypes: {
        //   type: "string",
        //   optional: this.nodeJson?.input !== "Attachment",
        //   nullable: this.nodeJson?.input !== "Attachment",
        //   min: 1,
        //   label: TransText.getTranslate('attachmentType')
        // }
      },
    };
    const ButtonSchema = {
      "mandatory-action": {
        type: "object",
        optional: this?.parentNode?.nodeJson?.type === "updateform",
        nullable: this?.parentNode?.nodeJson?.type === "updateform",
        props: {
          type: {
            type: "enum",
            values: ["create-card", "update-card"],
          },
          variables: {
            type: "object",
            props: {
              cardCollection: {
                type: "string",
                optional: true,
                nullable: true,
              },
              name: {
                type: "string",
                empty: false,
                optional: isNameOptional,
                messages: {
                  required: TransText.getTranslate("valueIsRequiredByNode", TransText.getTranslate('cardName'))
                },
              },
              listHippoId: {
                type: "enum",
                nullable: true,
                optional: isListOptional,
                values: trelloListIds,
              },
              description: "string|optional",
            },
          },
        },
      },
    };
    const TrelloChecklistScheme = {
      label: "string",
      name: "string",
      schema: "object",
      settings: "object",
      validationRules: validationRulesScheme,
      elementData: {
        type: "object",
        props: {
          include: {
            type: "object",
            props: {
              variable: {
                type: "string",
                label: TransText.getTranslate('variable'),
              }
            },
          }
        },
      },
    }
    const TrelloLabelScheme = {
      label: "string",
      name: "string",
      schema: "object",
      settings: "object",
      validationRules: validationRulesScheme,
      elementData: {
        type: "object",
        props: {
          include: {
            type: "object",
            props: {
              type: {
                type: "enum",
                values: ["selected", "all", "variable"],
              },
              variable: {
                type: "string",
                optional:
                  this.nodeJson?.props?.elementData?.include?.type !==
                  "variable",
                label: "Variable",
              },
              selected: {
                type: "array",
                nullable:
                  this.nodeJson?.props?.elementData?.include?.type !==
                  "selected",
                optional:
                  this.nodeJson?.props?.elementData?.include?.type !==
                  "selected",
                minItems: 1,
                messages: {
                  required: TransText.getTranslate('xSelectorNoAnySelectedOption', TransText.getTranslate('label'), "Trello Label Selector"),
                },
              },
            },
          }
        },
      },
    };
    const TrelloListScheme = {
      label: "string",
      name: "string",
      schema: "object",
      settings: "object",
      validationRules: validationRulesScheme,
      elementData: {
        type: "object",
        props: {
          include: {
            type: "object",
            props: {
              type: {
                type: "enum",
                values: ["selected", "all", "variable"],
              },
              variable: {
                type: "string",
                optional:
                  this.nodeJson?.props?.elementData?.include?.type !==
                  "variable",
                label: "Variable",
              },
              selected: {
                type: "array",
                nullable:
                  this.nodeJson?.props?.elementData?.include?.type !==
                  "selected",
                optional:
                  this.nodeJson?.props?.elementData?.include?.type !==
                  "selected",
                minItems: 1,
                messages: {
                  required: TransText.getTranslate('xSelectorNoAnySelectedOption', TransText.getTranslate('list'), "Trello List Selector"),
                },
                items: {
                  type: "enum",
                  values: trelloListIds
                }
              },
            },
          }
        },
      },
    };

    const TrelloUserSelectorSchema = {
      label: "string",
      name: "string",
      schema: "object",
      settings: "object",
      validationRules: validationRulesScheme,
      allowAddUser: "boolean|optional",
      elementData: {
        type: "object",
        props: {
          userGroups: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              props: {
                type: {
                  type: "enum",
                  values: ["hipporelloRole", "consoleRoles", "trelloRoles"],
                },
                id: "string",
              },
              custom: (value, errors) => {
                const enumValues = this.getRoles(true);
                if (value?.type === "hipporelloRole") {
                  if (!enumValues.includes(value?.id)) {
                    errors.push({
                      type: "enumValue",
                      expected: this.getRoles()?.map((i) => i?.name),
                    });
                  }
                }
                return value;
              },
            },
            messages: {
              required: TransText.getTranslate("formAtLeastGroup"),
              minItems: TransText.getTranslate("formAtLeastGroup"),
            },
          },
          creatingGroups: {
            optional: !this.nodeJson?.props?.allowAddUser,
            type: "array",
            minItems: 1,
            items: {
              type: "enum",

              values: this.getRoles(true),
            },
            messages: {
              required:
                TransText.getTranslate('atLeastRoleMustSelectedUserErrorMessage'),
              minItems:
                TransText.getTranslate('atLeastRoleMustSelectedUserErrorMessage'),
            },
          },
        },
      },
    };
    const AttachmentSelectorSchema = {
      label: "string",
      name: "string",
      schema: "object",
      settings: "object",
      elementData: {
        type: "object",
        props: {
          source: {
            type: "string",
            messages: {
              required: TransText.getTranslate('validate.required', {field: TransText.getTranslate('attachmentSource')}),
            },
          }
        }
      }
    }
    const AttachmentSchema = {
      label: "string",
      name: "string",
      schema: "object",
      validationRules: validationRulesScheme,
    }
    const BooleanSchema = {
      label: "string",
      description: "string|optional",
      name: "string",
      schema: "object",
      validationRules: validationRulesScheme,
      settings: {
        type: "object",
        props: {
          inputType: "string",
          noText: {
            type: "string",
            optional: this.nodeJson?.props?.settings?.inputType !== "selectBox",
            messages: {
              required: TransText.getTranslate('validate.required', {field: TransText.getTranslate('no')}),
            },
          },
          yesText: {
            type: "string",
            optional: this.nodeJson?.props?.settings?.inputType !== "selectBox",
            messages: {
              required: TransText.getTranslate('validate.required', {field: TransText.getTranslate('yes')}),
            },
          },
          placeholder: "string|optional",
          descriptionSwitch: "boolean",
          defaultValue: "boolean|optional",
        },
      },
    };
    const RadioBoxSchema = {
      label: "string|optional",
      description: "string|optional",
      name: "string",
      schema: "object",
      validationRules: "object",
      settings: "object",
      data: {
        type: "array",
        items: {
          type: "object",
          props: {
            value: {
              label: TransText.getTranslate('option'),
              type: "string",
              optional: false,
              minLength: 1,
            },
          },
        },
      },
    };
    const errors = [];
    let propsErrors = [];
    errors.pushArray(formInputCheck(this.nodeJson));
    if (this.nodeJson?.input === FORM_INPUT_NAMES.BUTTON) {
      const checker = getValidator().compile(ButtonSchema);
      propsErrors.pushArray(checker(this.nodeJson?.props));
    }
    if (
      this.nodeJson?.input === FORM_INPUT_NAMES.RADIO_BUTTON ||
      this.nodeJson?.input === FORM_INPUT_NAMES.MULTISELECTBOX ||
      this.nodeJson?.input === FORM_INPUT_NAMES.CHECKBOX ||
      this.nodeJson?.input === FORM_INPUT_NAMES.SELECT_BOX
    ) {
      const checker = getValidator().compile(RadioBoxSchema);
      propsErrors.pushArray(checker(this.nodeJson.props));
    }
    if (this.nodeJson?.input === FORM_INPUT_NAMES.TRELLO_LABEL_SELECTOR) {
      const checker = getValidator().compile(TrelloLabelScheme);
      propsErrors.pushArray(checker(this.nodeJson.props));
    }
    if (this.nodeJson?.input === FORM_INPUT_NAMES.TRELLO_LIST_SELECTOR) {
      const checker = getValidator().compile(TrelloListScheme);
      propsErrors.pushArray(checker(this.nodeJson.props));
    }
    if (this.nodeJson?.input === FORM_INPUT_NAMES.TRELLO_CHECKLIST_SELECTOR) {
      const checker = getValidator().compile(TrelloChecklistScheme);
      propsErrors.pushArray(checker(this.nodeJson.props));
    }
    if (this.nodeJson?.input === FORM_INPUT_NAMES.FIELD_SELECTOR) {
      propsErrors.pushArray(fieldSelectorCheck.call(this, validationRulesScheme)(this?.nodeJson?.props || {}));
    }
    if (this.nodeJson?.input === FORM_INPUT_NAMES.USER_SELECTOR) {
      const checker = getValidator({
        useNewCustomCheckerFunction: true,
      }).compile(TrelloUserSelectorSchema);
      propsErrors.pushArray(checker(this.nodeJson.props));
    }
    if(this.nodeJson?.input === FORM_INPUT_NAMES.ATTACHMENT_SELECTOR){
      const checker = getValidator().compile(AttachmentSelectorSchema);
      propsErrors.pushArray(checker(this.nodeJson.props));
    }
    if(this.nodeJson?.input === FORM_INPUT_NAMES.ATTACHMENT){
      const checker = getValidator().compile(AttachmentSchema);
      propsErrors.pushArray(checker(this.nodeJson.props));
    }
    if (this.nodeJson?.input === FORM_INPUT_NAMES.BOOLEAN) {
      const checker = getValidator().compile(BooleanSchema);
      propsErrors.pushArray(checker(this.nodeJson.props));
    }
    if (
      [
        FORM_INPUT_NAMES.RADIO_BUTTON,
        FORM_INPUT_NAMES.SELECT_BOX,
        FORM_INPUT_NAMES.MULTISELECTBOX,
        FORM_INPUT_NAMES.CHECKBOX,
      ].includes(this.nodeJson?.input)
    ) {
      const data = this?.nodeJson?.props?.data?.map((it) => it.value) || [];
      if (data.length !== uniq(data).length) {
        errors.push({
          type: "uniqueValue",
          label: "Option values",
          actual: JSON.stringify(data),
          field: "props.data",
        });
      }
    }
    propsErrors = propsErrors.map((error) => ({
      ...error,
      field: `props.${error?.field}`,
    }));
    errors.pushArray(propsErrors);
    return errors;
  }
}
