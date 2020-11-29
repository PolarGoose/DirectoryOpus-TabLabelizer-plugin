function OnInit(data) {
    data.name = "Tab labelizer";
    data.desc = "Gives more detailed names to tabs";
    data.version = "0.0-dev";
    data.url = "https://github.com/PolarGoose/DirectoryOpus-TabLabelizer-plugin";
    data.default_enable = true;
    data.config_desc = DOpus.NewMap();
    data.config.debug = false;
    data.config_desc("debug") = "Print debug messages to the script log";
}

function OnAfterFolderChange(data) {
    debug("OnAfterFolderChange");
    if (!data.result) {
        return;
    }
    setTabName(data.tab);
}

function setTabName(tab) {
    var displayPath = DOpus.fsutil().DisplayName(tab.path, "r");
    debug("updateLister. originalPath='" + tab.path + "'; displayPath='" + displayPath + "'");
    runDopusCommand('GO TABNAME="' + getTabLabel(displayPath) + '"', tab);
}

function getTabLabel(displayPath) {
    if (displayPath.substring(0, 6) === "ftp://") {
        return getFtpLabel(displayPath);
    }

    return getUncLabel(displayPath);
}

function getFtpLabel(path) {
    var pathParts = splitWithoutEmptyElements(path, '/');
    if (pathParts.length <= 5) {
        // path is already too short, we don't need to do anything with it
        return path;
    }
    return pathParts[0] + "//" + pathParts[1] + "//" + pathParts[2] + "/../" + pathParts[pathParts.length - 2] + "/" + pathParts[pathParts.length - 1];
}

function getUncLabel(path) {
    var pathParts = splitWithoutEmptyElements(path, '\\');
    if (pathParts.length <= 4) {
        // path is already too short, we don't need to do anything with it
        return path
    }
    var uncPathPrefix = path.substring(0, 2) === "\\\\" ? "\\\\" : "";
    return uncPathPrefix + pathParts[0] + "\\" + pathParts[1] + "\\..\\" + pathParts[pathParts.length - 2] + "\\" + pathParts[pathParts.length - 1]
}

function splitWithoutEmptyElements(str, separator) {
    return removeEmptyElements(str.split(separator));
}

function removeEmptyElements(stringArray) {
    var res = []
    for (i = 0; i < stringArray.length; i++) {
        if (stringArray[i].length) {
            res.push(stringArray[i]);
        }
    }
    return res;
}

function runDopusCommand(command, tab) {
    debug("runDopusCommand '" + command + "'");

    var dopusCommand = DOpus.NewCommand;
    dopusCommand.SetSourceTab(tab);
    dopusCommand.RunCommand(command);
}

function debug(text) {
    if (Script.config.debug) {
        DOpus.Output(text);
    }
}
