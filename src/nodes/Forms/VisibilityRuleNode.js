import AbstractHippoNode from "../AbstractHippoNode";
import Validator from "fastest-validator";
import {isEmpty} from "lodash";

const visibilityRuleSchema = {
    field: "string|required",
    value: "array|optional",
    operator: "string"
}
const visibilityRuleCheck = new Validator().compile(visibilityRuleSchema);
export default class VisibilityRuleNode extends AbstractHippoNode {
    constructor(appJson, path) {
        super(appJson, path);
    }

    process(appJson, path, nodeJson) {
        super.process(appJson, path, nodeJson);
    }

    getValidatorFunction() {
        const errors = [];
        errors.pushArray(visibilityRuleCheck(this.nodeJson));
        if (!['is_not_empty', 'is_empty'].includes(this.nodeJson.operator) && !Array.isArray(this.nodeJson.value)) {
            errors.push(this.createValidationError('required', 'value', this.nodeJson.value, null, null, "The 'Value' is required"))
        }
        return errors;
    }
}
