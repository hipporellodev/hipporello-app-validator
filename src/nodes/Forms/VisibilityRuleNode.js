import AbstractHippoNode from "../AbstractHippoNode";
import {formConditionRule} from "../../Utils/formConditionWithAnd";

export default class VisibilityRuleNode extends AbstractHippoNode {
  constructor(appJson, path) {
    super(appJson, path);
  }

  process(appJson, path, nodeJson) {
    super.process(appJson, path, nodeJson);
  }

  getValidatorFunction() {
    const errors = [];
    errors.pushArray(formConditionRule(this?.nodeJson))
    if (this.nodeJson.valueType === 'select' && Array.isArray(this.nodeJson.value)) {
      const elements = this.getFormElements();
      const selectedElement = elements?.find(it => it.id === this.nodeJson.field);
      const data = selectedElement?.props?.data?.map(item => {
        return item.value;
      })
      this.nodeJson?.value?.forEach(value => {
        if (!data?.includes(value)) {
          errors.push(this.createValidationError('oneOf', 'value', this.nodeJson.value, data, data));
        }
      });
    }
    return errors;
  }

  getFormElements(){
    const formJson = this.parentNode?.parentNode?.parentNode?.nodeJson;
    return (formJson?.body?.rows||[])?.reduce((acc, cur) => {
      return [...acc, ...cur?.columns?.map(column => {
        return column.element;
      })]
    }, [])
  }
}
