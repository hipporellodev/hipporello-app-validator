import AbstractHippoNode from "../AbstractHippoNode";
import {string} from "yup";
import Validator from "fastest-validator";

const viewSettingsSchema = {
    appViewSettings: {
        type: 'object',
        props: {
            icon: {
                type: 'object',
                props: {
                    name: 'string|optional',
                    url: 'string|optional',
                    background: 'string',
                    iconSet: {
                        type: 'enum',
                        values: ['fontAwesome']
                    },
                    type: {
                        type: 'enum',
                        values: ['image', 'icon']
                    }
                }
            }
        }
    },
    portalViewSettingOverrides: {
        type: 'object',
        optional: true,
        nullable: true,
        props: {
            type: {
              type: "enum",
              values: ["custom"]
            },
            css: {
                type: 'object',
                optional: true,
                props: {
                    simple: {
                        type: 'object',
                        props: {
                            "body-text-color": 'string|optional',
                            "font-family": 'string|optional',
                            "primary-color": 'string|optional'
                        }
                    }
                }
            },
            images: {
                type: 'object',
                optional: true,
                props: {
                    banner: 'string|optional',
                    logo: 'string|optional',
                    socialShareImage: 'string|optional'
                }
            }
        }
    }
}
const viewSettingsCheck = new Validator().compile(viewSettingsSchema);
const viewSettingsNameSchema = {
    name: 'string',
}
const viewSettingsUrlSchema = {
    url: 'string',
}
const viewSettingsUrlCheck = new Validator().compile(viewSettingsUrlSchema);
const viewSettingsNameCheck = new Validator().compile(viewSettingsNameSchema);
export default class ViewSettingsNode extends AbstractHippoNode {
    constructor(appJson, path) {
        super(appJson, path);
    }

    process(appJson, path, nodeJson) {
    }

    getValidatorFunction() {
        let errors = [];
        const viewSettingsCheckResult = viewSettingsCheck(this.nodeJson);
        if (Array.isArray(viewSettingsCheckResult)) {
            errors.pushArray(viewSettingsCheckResult);
        }
        if (this.nodeJson.appViewSettings.icon.type === 'image') {
            const result = viewSettingsUrlCheck(this.nodeJson.appViewSettings.icon);
            if (Array.isArray(result)) {
                this.validatorPath = `${this.path}.appViewSettings.icon`
                errors.pushArray(result);
            }
        } else if (this.nodeJson.appViewSettings.icon.type === 'icon') {
            const result = viewSettingsNameCheck(this.nodeJson.appViewSettings.icon);
            if (Array.isArray(result)) {
                this.validatorPath = `${this.path}.appViewSettings.icon`
                errors.pushArray(result);
            }
        }
        return errors;
    }
}
