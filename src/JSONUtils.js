import _ from "lodash"
export default class JSONUtils {
    static query(json, path){
        if(path == null){
            return json
        }
        return _.get(json, path);

    }
    static clone(data){
        return _.cloneDeep(data)
    }

    static jsonPatchPathToQueryPath(path, seperator = "/"){
        let allPaths = path.split(seperator);
        allPaths = allPaths.filter(Boolean)
        let finalResult = "";
        let numRegExp = /^\d+$/;
        for(let i=0; i < allPaths.length; i++){
            let pathItem = allPaths[i];
            let val = null;
            if(numRegExp.test(pathItem)){
                val = "["+pathItem+"]"
            }
            else{
                val = pathItem
            }
            // else{
            //     val = "[\""+pathItem+"\"]";
            // }
            if(val.charAt(0) === '['){
                finalResult += val;
            }
            else{
                finalResult += finalResult.length===0?val:"."+val;
            }
        }
        return finalResult
    }
}
