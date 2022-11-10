import AbstractHippoNode from "../AbstractHippoNode";
import {conditionsWithOr} from "../../Utils/conditionWithOr";
import {conditionsWithAnd} from "../../Utils/conditionsWithAnd";
import {includesOneOf, startsWithOneOf} from "../../Utils/helpers";

const arrayOperators = ['in', 'notin', 'allin', 'anyin']
export default class ConditionNode extends AbstractHippoNode{
    constructor(appJson, path) {
        super(appJson, path);
    }
    process(appJson, path, nodeJson) {
        console.log(nodeJson);
    }
    getValidatorFunction() {
        const errors = [];
        if (startsWithOneOf(this.nodeJson.field, ['card.hf_', 'parentCard.hf_'])) {
            const hfId = this.nodeJson?.field?.replace('card.', '').replace('parentCard.', '');
            const hippoFields = this.getHippoFields(true);
            if (!this.getHippoFields(false, (it) => it.id === hfId)?.length) {
                errors?.push(this.createValidationError('oneOf', 'field', hfId, hippoFields, hippoFields))
            }
        } else if(includesOneOf(this.nodeJson.field, ['tc_listHippoId'])) {
            let values = this.nodeJson.value;
            const availableLists = this?.entitiesIds?.trelloLists || [];
            if (!Array.isArray(this.nodeJson.value)) {
                values = [values];
            }
            values.forEach(value => {
                if (!availableLists.includes(value)) {
                    errors?.push(this.createValidationError('oneOf', 'value', this.nodeJson.value, availableLists, availableLists))
                }
            })
        } else if (includesOneOf(this.nodeJson.field, ["tc_labelHippoIds", "tc_labelHippoId"])) {
            let values = this.nodeJson.value;
            const availableLabels = this?.entitiesIds?.trelloLabels || [];
            if (!Array.isArray(this.nodeJson.value)) {
                values = [values];
            }
            values.forEach(value => {
                if (!availableLabels.includes(value)) {
                    errors?.push(this.createValidationError('oneOf', 'value', this.nodeJson.value, availableLabels, availableLabels))
                }
            })
        }
        return errors;
    }
}