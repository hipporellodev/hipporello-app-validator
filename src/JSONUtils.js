import get from "lodash/get";
export default class JSONUtils {
  static query(json, path) {
    if (path == null) {
      return json;
    }
    return get(json, path);
  }
}
