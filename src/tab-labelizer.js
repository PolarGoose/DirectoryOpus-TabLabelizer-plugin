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
    if (startsWith(displayPath, "ftp://")) {
        // ftp paths are not supported by this script, don't alter the existing DOpus behavior
        return "";
    }

    displayPath = tryApplyAlias(displayPath)
    return getTruncatedLabel(displayPath);
}

// If there is an alias defined in "Folder Aliases", returns the path starting from this alias name, otherwise returns the same unmodified path.
// Example: "C:\Users\Public\Folder1\Folder2\Folder3" => "commonfiles\Folder1\Folder2\Folder3"
function tryApplyAlias(path) {
    var alias = getAlias(path)
    if(alias === null) {
        return path;
    }

    var aliasPath = String(alias.Path)
    if(lastSymbol(aliasPath) === "\\") {
        return alias + path.substring(aliasPath.length - 1);
    }
    return alias + path.substring(aliasPath.length);
}

function getAlias(path) {
    // Before accessing Aliases dictionary, we need to update it in case a user added new aliases while the script was running
    DOpus.Aliases.Update()

    matchingAliases = []
    for (var e = new Enumerator(DOpus.Aliases); !e.atEnd(); e.moveNext()) {
        var alias = e.item();
        if(startsWith(path, alias.Path)) {
            matchingAliases.push(alias);
        }
    }

    if(matchingAliases.length === 0) {
        return null
    }

    return getAliasWithLongestPath(matchingAliases)
}

function getAliasWithLongestPath(aliasesArray) {
    return aliasesArray.sort(function (a, b) { return new String(b.Path).length - new String(a.Path).length })[0];
}

function getTruncatedLabel(path) {
    var pathParts = splitWithoutEmptyElements(path, '\\');
    if (pathParts.length <= 4) {
        return truncateIfTooLong(path)
    }

    var uncPathPrefix = startsWith(path, "\\\\") ? "\\\\" : "";
    var res = uncPathPrefix + pathParts[0] + "\\" + pathParts[1] + "\\..\\" + pathParts[pathParts.length - 2] + "\\" + pathParts[pathParts.length - 1];
    return truncateIfTooLong(res)
}

function splitWithoutEmptyElements(str, separator) {
    return removeEmptyElements(str.split(separator));
}

function truncateIfTooLong(label) {
    return label.length <= 40 ? label : label.substring(0, 40) + "~"
}

function startsWith(str, prefix) {
    return str.indexOf(prefix) === 0
}

function lastSymbol(str) {
    return str[str.length - 1]
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
