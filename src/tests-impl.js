function assertAreEqual(actualStr, expectedSrt) {
    if (expectedSrt !== actualStr) {
        WScript.Echo("Assert failed: \n actualStr='" + actualStr + "' \n expectedSrt='" + expectedSrt + "'");
        WScript.Quit(1);
    }
}

function test_getTabLabel(path, expectedLabel) {
    assertAreEqual(getTabLabel(path), expectedLabel);
}

function test_getTabLabel_theSame(path) {
    assertAreEqual(getTabLabel(path), path);
}

// ftp
test_getTabLabel_theSame("ftp://some.ftp.server.com//");
test_getTabLabel_theSame("ftp://some.ftp.server.com//1");
test_getTabLabel_theSame("ftp://some.ftp.server.com//1/2");
test_getTabLabel_theSame("ftp://some.ftp.server.com//1/2/3");
test_getTabLabel("ftp://some.ftp.server.com//1/2/3/4", "ftp://some.ftp.server.com//1/../3/4");
test_getTabLabel("ftp://some.ftp.server.com//1/2/3/4/5", "ftp://some.ftp.server.com//1/../4/5");
test_getTabLabel("ftp://some.ftp.server.com//1/2/3/4/5/6", "ftp://some.ftp.server.com//1/../5/6");
test_getTabLabel("ftp://some.ftp  com//1 1/2 2/3 3/4/5", "ftp://some.ftp  com//1 1/../4/5");

// lib
test_getTabLabel_theSame("Library");
test_getTabLabel_theSame("This PC");
test_getTabLabel_theSame("lib://documents");

// UNC
test_getTabLabel_theSame("\\\\127.0.0.1");
test_getTabLabel_theSame("\\\\127.0.0.1\\c$");
test_getTabLabel_theSame("\\\\127.0.0.1\\c$\\1");
test_getTabLabel_theSame("\\\\127.0.0.1\\c$\\1\\2");
test_getTabLabel("\\\\127.0.0.1\\c$\\1\\2\\3", "\\\\127.0.0.1\\c$\\..\\2\\3");
test_getTabLabel("\\\\127.0.0.1\\c$\\1\\2\\3\\4", "\\\\127.0.0.1\\c$\\..\\3\\4");

// Normal path
test_getTabLabel_theSame("C:\\")
test_getTabLabel_theSame("C:\\1")
test_getTabLabel_theSame("C:\\1\\2")
test_getTabLabel_theSame("C:\\1\\2\\3")
test_getTabLabel("C:\\1\\2\\3\\4", "C:\\1\\..\\3\\4")
test_getTabLabel("C:\\1\\2\\3\\4\\5", "C:\\1\\..\\4\\5")
