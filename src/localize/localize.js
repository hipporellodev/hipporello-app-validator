import LocalizedStrings from "react-localization";
import en from './langs/en.json';
class Localize extends LocalizedStrings{
  getLanguageString(lang){
    const props = this.getContent();
    return props.hasOwnProperty(lang) ? props[lang] : this.default;
  }
  getTranslate(tag, ...args){
    if(!this.isTag(tag)) return `HIPPO-TEX-[${tag}]`;
    if(args.length) return this.formatString(this.getKeyString(tag), ...args)
    return this.getKeyString(tag);
  }
  addContent(props){
    this.setContent({...this.getContent(), ...props})
  }
  getKeyString(key, language){
    let omitWarning = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    try {
      //eslint-disable-next-line @typescript-eslint/no-this-alias
      let current = this;
      if(current?.[key]) return current[key]
      const paths = key.split(".");
      for (let i = 0; i < paths.length; i += 1) {
        if (current[paths[i]] === undefined) {
          throw Error(paths[i]);
        }
        current = current[paths[i]];
      }
      return current;
    } catch (ex) {
      if (!omitWarning && this._opts.logsEnabled) {
        console.debug("No localization found for key '" + key + "' and language '" + language + "', failed on " + ex.message);
      }
    }
    return null;
  }
  getOrjTranslate(tag, ...args){
    if(!this.getString(tag, 'en')) return `HIPPO-TEX-[${tag}]`;
    if(args.length) return this.formatString(this.getString(tag, 'en'), ...args)
    return this.getString(tag, 'en');
  }
  isTag(tag){return !!this.getKeyString(tag)}
}
export default Localize;
export const TransText = new Localize({en}, {logsEnabled: false})
