import AbstractHippoNode from "../AbstractHippoNode";
import ActionGroupNode from "../ActionGroupNode";
import Validator from "fastest-validator";
import { FORM_INPUT_NAMES } from "../../Utils/formInputNames";
import FormInputVisibilityNode from "./FormInputVisibilityNode";
import uniq from "lodash/uniq";

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

const formInputCheck = new Validator().compile(formInputSchema);
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
    const fieldMapping = this?.parentNode?.nodeJson?.body?.fieldMapping;
    Object.values(fieldMapping || {}).forEach((fieldMap) => {
      if (
        fieldMap?.trelloCardField &&
        fieldMap.trelloCardField?.targetField === "name"
      ) {
        isNameOptional = true;
      }
    });
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
          optional: true,
          nullable: true,
          min: 0,
          max: this.nodeJson?.props?.validationRules?.maxLength,
          label: "Min Length",
        },
        maxLength: {
          type: "number",
          optional: true,
          nullable: true,
          min: this.nodeJson?.props?.validationRules?.minLength,
          label: "Max Length",
        },
        minItems: {
          type: "number",
          optional: true,
          nullable: true,
          min: 0,
          max: this.nodeJson?.props?.validationRules?.maxItems,
          label: "Min Items",
        },
        maxItems: {
          type: "number",
          optional: true,
          nullable: true,
          min: this.nodeJson?.props?.validationRules?.minItems,
          label: "Max Items",
        },
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
                  required: "Card Name is a required field",
                },
              },
              listHippoId: {
                type: "enum",
                values: trelloListIds,
              },
              description: "string|optional",
            },
          },
        },
      },
    };
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
                  required: "No label selected for Trello Label Selector",
                },
              },
            },
          },
          fields: "array",
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
              required: "At least 1 group must be selected",
              minItems: "At least 1 group must be selected",
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
                "At least 1 role must be selected for the user to be created.",
              minItems:
                "At least 1 role must be selected for the user to be created.",
            },
          },
        },
      },
    };
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
              required: "The 'No' field is required.",
            },
          },
          yesText: {
            type: "string",
            optional: this.nodeJson?.props?.settings?.inputType !== "selectBox",
            messages: {
              required: "The 'Yes' field is required.",
            },
          },
          placeholder: "string|optional",
          descriptionSwitch: "boolean",
          defaultValue: "boolean|optional",
        },
      },
    };
    const RadioBoxSchema = {
      label: "string",
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
              type: "string",
              optional: false,
              minLength: 1,
              messages: {
                required: "Option cannot be empty",
              },
            },
          },
        },
      },
    };
    const errors = [];
    let propsErrors = [];
    errors.pushArray(formInputCheck(this.nodeJson));
    if (this.nodeJson?.input === FORM_INPUT_NAMES.BUTTON) {
      const checker = new Validator().compile(ButtonSchema);
      propsErrors.pushArray(checker(this.nodeJson?.props));
    }
    if (
      this.nodeJson?.input === FORM_INPUT_NAMES.RADIO_BUTTON ||
      this.nodeJson?.input === FORM_INPUT_NAMES.CHECKBOX ||
      this.nodeJson?.input === FORM_INPUT_NAMES.SELECT_BOX
    ) {
      const checker = new Validator().compile(RadioBoxSchema);
      propsErrors.pushArray(checker(this.nodeJson.props));
    }
    if (this.nodeJson?.input === FORM_INPUT_NAMES.TRELLO_LABEL_SELECTOR) {
      const checker = new Validator().compile(TrelloLabelScheme);
      propsErrors.pushArray(checker(this.nodeJson.props));
    }
    if (this.nodeJson?.input === FORM_INPUT_NAMES.USER_SELECTOR) {
      const checker = new Validator({
        useNewCustomCheckerFunction: true,
      }).compile(TrelloUserSelectorSchema);
      propsErrors.pushArray(checker(this.nodeJson.props));
    }
    if (this.nodeJson?.input === FORM_INPUT_NAMES.BOOLEAN) {
      const checker = new Validator().compile(BooleanSchema);
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
