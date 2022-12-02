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
const LATEST_APP_SCHEMA_VERSION = 3;
export {
  LATEST_APP_SCHEMA_VERSION,
  SUBDOMAIN_BLACKLIST,
  PAGE_SLUG_BLACKLIST,
  APP_SLUG_BLACKLIST
};
