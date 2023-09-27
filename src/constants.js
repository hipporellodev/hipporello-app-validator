const SUBDOMAIN_BLACKLIST = ["playground", "console", "hippo", "admin"]
const PAGE_SLUG_BLACKLIST = [
  "forms",
  "form",
  "page",
  "signin",
  "signup",
  "forgot"
]
const APP_SLUG_BLACKLIST = [
  "hippo",
  "trello",
  "hipporello",
  "onboarding"
]
const LATEST_APP_SCHEMA_VERSION = 4;
const VARIABLE_TYPES = ["string", "double", "long", "boolean", "attachment", "date", "datetime", "time"]
const RESOLVE_TYPES = {
  RESOLVE_LIST_BY_HIPPO_ID: "RESOLVE_LIST_BY_HIPPO_ID",
  RESOLVE_LABEL_BY_HIPPO_ID: "RESOLVE_LABEL_BY_HIPPO_ID",
  RESOLVE_MEMBER_BY_TRELLO_ID: "RESOLVE_MEMBER_BY_TRELLO_ID",
  RESOLVE_USER_BY_USER_ID: "RESOLVE_USER_BY_USER_ID",
  RESOLVE_BOARD_BY_TRELLO_BOARD_ID: "RESOLVE_BOARD_BY_TRELLO_BOARD_ID",
  RESOLVE_CARD_BY_CARD_ID: "RESOLVE_CARD_BY_CARD_ID",
  RESOLVE_FIELD_DEFINITION_BY_ID: "RESOLVE_FIELD_DEFINITION_BY_ID",
}
const OPERATORS = [
  "equals",
  "notequals",
  "contains",
  "notcontains",
  "startswith",
  "notstartswith",
  "endswith",
  "notendswith",
  "lessthan",
  "lessthanequals",
  "greaterthan",
  "greaterthanequals",
  "in",
  "allin",
  "anyin",
  "notin",
  "empty",
  "notempty",
  "has",
  "hasall",
  "hasany",
  "hasnone",
  "doesnthave",
]

export {
  VARIABLE_TYPES,
  RESOLVE_TYPES,
  OPERATORS,
  LATEST_APP_SCHEMA_VERSION,
  SUBDOMAIN_BLACKLIST,
  PAGE_SLUG_BLACKLIST,
  APP_SLUG_BLACKLIST
};
