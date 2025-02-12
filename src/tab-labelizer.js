var folderAliasesToIgnore = ["homeroot", "default", "last"]

function OnInit(data) {
  data.name = "Tab labelizer"
  data.desc = "Gives more detailed names to tabs"
  data.version = "0.0-dev"
  data.url = "https://github.com/PolarGoose/DirectoryOpus-TabLabelizer-plugin"
  data.default_enable = true
  data.config_desc = DOpus.NewMap()
  data.config.maxTabLabelLength = 40
  data.config_desc("maxTabLabelLength") = "Specifies the maximum length of the tab label"
  data.config.debug = false
  data.config_desc("debug") = "Print debug messages to the script log"
}

function OnAfterFolderChange(/* AfterFolderChangeData */ data) {
  debug("OnAfterFolderChange")
  if (!data.result) {
    return
  }
  setTabName(data.tab)
}

function setTabName(/* Tab */ tab) {
  var tabDisplayName = DOpus.fsutil().DisplayName(tab.path, "r")
  debug("updateLister. originalPath='" + tab.path + "'; tabDisplayName='" + tabDisplayName + "'")
  runDopusCommand('GO TABNAME="' + getTabLabel(tabDisplayName) + '"', tab)
}

function getTabLabel(path) {
  // ftp paths are not supported by this script, don't alter the existing DOpus behavior
  if (startsWith(path, "ftp://")) {
    return ""
  }
  return getLabel(tryApplyAlias(path))
}

// If there is an alias defined in "Folder Aliases", returns the path starting from the alias name.
// Example:
//   "C:\Users\Public\Folder1\Folder2\Folder3" => "commonfiles\Folder1\Folder2\Folder3"
function tryApplyAlias(path) {
  var alias = getBestMatchingAlias(path)

  // if no alias is defined, return the original path
  if (alias === null) {
    return path
  }

  var aliasPath = String(alias.Path)
  // If path ends with a backslash, adjust substring index accordingly
  var suffixStart = (lastSymbol(aliasPath) === "\\") ? (aliasPath.length - 1) : aliasPath.length

  return alias + path.substring(suffixStart)
}

// Returns the alias with the longest matching prefix for a given path, ignoring any from “folderAliasesToIgnore”.
// There can be different aliases that are suitable for a given path. We choose the one with the longest path, because it is the most specific.
// For example the path "C:\Users\userName\AppData\Roaming\GPSoftware", can be converted to "profile\AppData\Roaming\GPSoftware" or "appdata\GPSoftware".
// We need to take the second one.
function /* Alias */ getBestMatchingAlias(path) {
  DOpus.Aliases.Update()

  var matchingAliases = []
  for (var e = new Enumerator(DOpus.Aliases); !e.atEnd(); e.moveNext()) {
    var alias = e.item()

    // Skip ignored aliases
    if(contains(folderAliasesToIgnore, alias)) {
      continue;
    }

    if (startsWith(path, alias.Path)) {
      matchingAliases.push(alias)
    }
  }

  if (matchingAliases.length === 0) {
    return null
  }

  // Return the alias with the longest Path
  return matchingAliases.sort(function(a, b) { return b.Path.length - a.Path.length })[0]
}

// Converts path into a shorter form. Examples:
//   C:\host\share\subdir1\subdir2\subdir3 => C:\host\~\subdir2\subdir3
//   \\host\share\subdir1\subdir2\subdir3 => \\host\share\~\subdir2\subdir3
function getLabel(path) {
  var pathParts = splitWithoutEmptyElements(path, "\\")

  if (pathParts.length <= 4) {
    return truncateIfTooLong(path)
  }

  var uncPrefix = startsWith(path, "\\\\") ? "\\\\" : ""
  var shortenedPath = uncPrefix + pathParts[0] + "\\" + pathParts[1] + "\\~\\" + pathParts[pathParts.length - 2] + "\\" + pathParts[pathParts.length - 1]
  return truncateIfTooLong(shortenedPath)
}

function splitWithoutEmptyElements(str, separator) {
  return removeEmptyElements(str.split(separator))
}

function truncateIfTooLong(label) {
  if (label.length <= Script.config.maxTabLabelLength) {
    return label
  }
  return label.substring(0, Script.config.maxTabLabelLength) + "~"
}

function contains(array, obj) {
  var i = array.length;
  while (i--) {
    if (array[i] == obj) {
      return true;
    }
  }
  return false;
}

function startsWith(str, prefix) {
  return str.indexOf(prefix) === 0
}

function lastSymbol(str) {
  return str.charAt(str.length - 1)
}

function removeEmptyElements(stringArray) {
    var res = []
    for (i = 0; i < stringArray.length; i++) {
        if (stringArray[i].length) {
            res.push(stringArray[i])
        }
    }
    return res
}

function runDopusCommand(command, tab) {
  debug("runDopusCommand '" + command + "'")
  var cmd = DOpus.NewCommand()
  cmd.SetSourceTab(tab)
  cmd.RunCommand(command)
}

function debug(text) {
  if (Script.config.debug) {
    DOpus.Output(text)
  }
}
