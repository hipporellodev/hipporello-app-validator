import AbstractHippoNode from "../AbstractHippoNode";
import Validator from "fastest-validator";
import getValidator from "../../Utils/getValidator";

const viewSettingsSchema = {
  appViewSettings: {
    type: "object",
    props: {
      icon: {
        type: "object",
        props: {
          name: "string|optional",
          url: "string|optional",
          background: "string",
          iconSet: {
            type: "enum",
            values: ["fontAwesome"],
          },
          type: {
            type: "enum",
            values: ["image", "icon"],
          },
        },
      },
    },
  },
  portalViewSettingOverrides: {
    type: "object",
    optional: true,
    nullable: true,
    props: {
      type: {
        type: "enum",
        values: ["custom"],
      },
      css: {
        type: "object",
        optional: true,
        props: {
          simple: {
            type: "object",
            props: {
              "body-text-color": "string|optional",
              "font-family": "string|optional",
              "primary-color": "string|optional",
            },
          },
        },
      },
      images: {
        type: "object",
        optional: true,
        props: {
          banner: "string|optional",
          logo: "string|optional",
          socialShareImage: "string|optional",
        },
      },
    },
  },
};
const viewSettingsCheck = getValidator().compile(viewSettingsSchema);
const viewSettingsNameSchema = {
  name: "string",
};
const viewSettingsUrlSchema = {
  url: {
    type: "string",
    messages: {
      required: "The 'Image' is required.",
    },
  },
};
const viewSettingsUrlCheck = getValidator().compile(viewSettingsUrlSchema);
const viewSettingsNameCheck = getValidator().compile(viewSettingsNameSchema);
export default class ViewSettingsNode extends AbstractHippoNode {
  constructor(appJson, path) {
    super(appJson, path);
  }

  process(appJson, path, nodeJson) {}

  getValidatorFunction() {
    let errors = [];
    const viewSettingsCheckResult = viewSettingsCheck(this.nodeJson);
    if (Array.isArray(viewSettingsCheckResult)) {
      errors.pushArray(viewSettingsCheckResult);
    }
    if (this.nodeJson.appViewSettings.icon.type === "image") {
      const result = viewSettingsUrlCheck(this.nodeJson.appViewSettings.icon);
      if (Array.isArray(result)) {
        this.validatorPath = `${this.path}.appViewSettings.icon`;
        errors.pushArray(result);
      }
    } else if (this.nodeJson.appViewSettings.icon.type === "icon") {
      const result = viewSettingsNameCheck(this.nodeJson.appViewSettings.icon);
      if (Array.isArray(result)) {
        this.validatorPath = `${this.path}.appViewSettings.icon`;
        errors.pushArray(result);
      }
    }
    return errors;
  }
}
