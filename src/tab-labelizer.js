var folderAliasesToIgnore = ["homeroot", "default", "last"]

function /* void */ OnInit(/* ScriptInitData */ data) {
  data.name = "Tab labelizer"
  data.desc = "Gives more detailed names to tabs"
  data.version = "6.0"
  data.url = "https://github.com/PolarGoose/DirectoryOpus-TabLabelizer-plugin"
  data.default_enable = true
  data.config.maxTabLabelLength = 40
  data.config.maxTabLabelLength.desc = "Specifies the maximum length of the tab label"
  data.config.debug = false
  data.config.debug.desc = "Print debug messages to the script log"
}

function /* void */ OnAfterFolderChange(/* AfterFolderChangeData */ data) {
  debug("OnAfterFolderChange")
  if (!data.result) {
    return
  }
  setTabName(data.tab)
}

function /* void */ setTabName(/* Tab */ tab) {
  var tabDisplayName = DOpus.fsutil().DisplayName(tab.path, "r")
  debug("updateLister. originalPath='" + tab.path + "'; tabDisplayName='" + tabDisplayName + "'")
  runDopusCommand('GO TABNAME="' + getTabLabel(tabDisplayName) + '"', tab)
}

function /* string */ getTabLabel(/* string */ path) {
  // ftp paths are not supported by this script, don't alter the existing DOpus behavior
  if (startsWith_caseInsensitive(path, "ftp://")) {
    return ""
  }
  return getLabel(tryApplyAlias(path))
}

// If there is an alias defined in "Folder Aliases", returns the path starting from the alias name.
// Example:
//   "C:\Users\Public\Folder1\Folder2\Folder3" => "commonfiles\Folder1\Folder2\Folder3"
function /* string */ tryApplyAlias(/* string */ path) {
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
function /* Alias */ getBestMatchingAlias(/* string */ path) {
  DOpus.Aliases.Update()

  var matchingAliases = []
  for (var e = new Enumerator(DOpus.Aliases); !e.atEnd(); e.moveNext()) {
    var alias = e.item()

    // Skip ignored aliases
    if (contains(folderAliasesToIgnore, alias)) {
      continue
    }

    if (startsWith_caseInsensitive(path, alias.Path)) {
      matchingAliases.push(alias)
    }
  }

  if (matchingAliases.length === 0) {
    return null
  }

  // Return the alias with the longest Path
  return matchingAliases.sort(function (a, b) { return new String(b.Path).length - new String(a.Path).length})[0]
}

// Converts path into a shorter form. Examples:
//   C:\host\share\subdir1\subdir2\subdir3 => C:\host\~\subdir2\subdir3
//   \\host\share\subdir1\subdir2\subdir3 => \\host\share\~\subdir2\subdir3
function /* string */ getLabel(/* string */ path) {
  var pathParts = splitWithoutEmptyElements(path, "\\")

  if (pathParts.length <= 4) {
    return truncateIfTooLong(path)
  }

  var uncPrefix = startsWith_caseInsensitive(path, "\\\\") ? "\\\\" : ""
  var shortenedPath = uncPrefix + pathParts[0] + "\\" + pathParts[1] + "\\~\\" + pathParts[pathParts.length - 2] + "\\" + pathParts[pathParts.length - 1]
  return truncateIfTooLong(shortenedPath)
}

function /* string[] */ splitWithoutEmptyElements(/* string */ str, /* string */ separator) {
  return removeEmptyElements(str.split(separator))
}

// Truncates the label in the middle
function /* string */ truncateIfTooLong(/* string */ label) {
  if (label.length <= Script.config.maxTabLabelLength) {
    return label
  }

  var firstPartLen = Math.floor(Script.config.maxTabLabelLength / 3)
  var lastPartLen = Script.config.maxTabLabelLength - firstPartLen - 1 // -1 for the "~" we insert
  return label.substring(0, firstPartLen) + "~" + label.substring(label.length - lastPartLen)
}

function /* bool */ contains(/* any[] */ array, /* any */ obj) {
  for (var i = 0; i < array.length; i++) {
    if (array[i] == obj) {
      return true
    }
  }
  return false
}

function /* bool */ startsWith_caseInsensitive(/* string */ str, /* string */ prefix) {
  return String(str).toLowerCase().indexOf(String(prefix).toLowerCase()) === 0
}

function /* char */ lastSymbol(/* string */ str) {
  return str.charAt(str.length - 1)
}

function /* string[] */ removeEmptyElements(/* string[] */ stringArray) {
  var res = []
  for (var i = 0; i < stringArray.length; i++) {
    if (stringArray[i].length) {
      res.push(stringArray[i])
    }
  }
  return res
}

function /* void */ runDopusCommand(/* string */ command, /* Tab */ tab) {
  debug("runDopusCommand '" + command + "'")
  var cmd = DOpus.NewCommand()
  cmd.SetSourceTab(tab)
  cmd.RunCommand(command)
}

function /* void */ debug(/* string */ text) {
  if (Script.config.debug) {
    DOpus.Output(text)
  }
}
