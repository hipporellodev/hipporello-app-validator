import AbstractHippoNode from "../../AbstractHippoNode";
import Validator from "fastest-validator";
import {RESOLVE_TYPES, VARIABLE_TYPES} from "../../../constants";
const appVariableSchema = {
  id: 'string',
  label: 'string',
  multiple: 'boolean',
  resolveBy: {
    type: "enum",
    optional: true,
    values: [
      RESOLVE_TYPES.RESOLVE_LIST_BY_HIPPO_ID,
      RESOLVE_TYPES.RESOLVE_LABEL_BY_HIPPO_ID,
      RESOLVE_TYPES.RESOLVE_MEMBER_BY_TRELLO_ID,
      RESOLVE_TYPES.RESOLVE_USER_BY_USER_ID,
      RESOLVE_TYPES.RESOLVE_BOARD_BY_TRELLO_BOARD_ID,
      RESOLVE_TYPES.RESOLVE_CARD_BY_CARD_ID,
      RESOLVE_TYPES.RESOLVE_APP_BY_APP_ID,
    ]
  },
  type : {
    type: 'enum',
    values: VARIABLE_TYPES
  }
}
const appVariableCheck = new Validator().compile(appVariableSchema)
export default class AppVariableNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  process(appJson, path, nodeJson) {
  }

  getValidatorFunction() {
    return appVariableCheck;
  }
}
