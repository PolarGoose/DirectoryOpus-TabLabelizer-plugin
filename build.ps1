Function Info($msg) {
    Write-Host -ForegroundColor DarkGreen "`nINFO: $msg`n"
}

Function Error($msg) {
    Write-Host `n`n
    Write-Error $msg
    exit 1
}

Function CheckReturnCodeOfPreviousCommand($msg) {
    if(-Not $?) {
        Error "${msg}. Error code: $LastExitCode"
    }
}

Function CreateZipArchive($file, $archiveFullName) {
    Info "Create zip archive: `n '$archiveFullName' from file `n '$file'"
    Compress-Archive -Force -Path $file -DestinationPath $archiveFullName
}

Function CopyFile($file, $dstFolder) {
    Info "Copy `n '$file' to `n '$dstFolder'"
    New-Item -Force -ItemType "directory" $dstFolder > $null
    Copy-Item -Force -Path $file -Destination $dstFolder > $null
}

Function InsertVersionInsideScript($sciptFile, $version) {
    Info "Insert version '$version' inside '$sciptFile'"

    $content = [System.IO.File]::ReadAllText($sciptFile).Replace( `
        "    data.version = `"0.0-dev`";", `
        "    data.version = `"$version`";")
    [System.IO.File]::WriteAllText($sciptFile, $content)
}

Function GetVersion() {
    $gitCommand = Get-Command -ErrorAction Stop -Name git

    $tag = & $gitCommand describe --exact-match --tags HEAD
    if(-Not $?) {
        $tag = "v0.0-dev"
        Info "The commit is not tagged. Use '$tag' as a version instead"
    }

    $commitHash = & $gitCommand rev-parse --short HEAD
    CheckReturnCodeOfPreviousCommand "Failed to get git commit hash"

    return "$($tag.Substring(1))~$commitHash"
}

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
$root = Resolve-Path $PSScriptRoot
$version = GetVersion

CopyFile $root/src/tab-labelizer.js $root/Build
InsertVersionInsideScript $root/Build/tab-labelizer.js $version
CreateZipArchive $root/Build/tab-labelizer.js $root/Build/DirectoryOpus-TabLabelizer-plugin
