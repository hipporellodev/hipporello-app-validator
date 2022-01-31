import AbstractHippoNode from "./AbstractHippoNode";


export default class MatchingNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  process(appJson, path, nodeJson) {
  }
  executeForMe(command, appliedParent) {
    if(command.getType() === NavigateCommand.TYPE){
      if(command.path === this.path || command.path.startsWith(this.path)){
        command.addOutput(`matching`)
      }
    }
    else super.executeForMe(command, appliedParent);
  }
}
