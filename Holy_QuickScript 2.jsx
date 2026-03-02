(function holyQuickScript(thisObj) {
    function buildUI(thisObj) {
        var myPanel = (thisObj instanceof Panel)
            ? thisObj
            : new Window("palette", "✨ Holy QuickScript ✨", undefined, { resizeable: true });

        myPanel.orientation = "column";
        myPanel.alignChildren = ["fill", "fill"];
        myPanel.spacing = 8;
        myPanel.margins = 10;

        // Give panel a decent minimum size so it doesn't start way too small
        myPanel.minimumSize = [300, 150];

        // Input field that should expand, but we try to allow collapse too
        var customInput = myPanel.add("edittext", undefined, "", {
            multiline: true,
            scrollable: true
        });

        // Default (preferred) size so docked panel has enough room initially
       customInput.preferredSize = [110, 100]; // starting size
customInput.minimumSize = [110, 30];    // lets it shrink vertically
customInput.maximumSize = [10000, 100]; // lets it stretch horizontally, not vertically

// Manual resizing to match parent width
function resizeCustomInput() {
    var newWidth = myPanel.size[0] - myPanel.margins[0] - myPanel.margins[2];
    if (newWidth < 110) newWidth = 110;
    customInput.size = [newWidth, 100];
    myPanel.layout.layout(true);
}

// Call at startup and on resizing
resizeCustomInput();
myPanel.onResizing = myPanel.onResize = function () {
    resizeCustomInput();
};


        // Button that stays small / doesn’t stretch
        var btnCustom = myPanel.add("button", undefined, "💀 Run Custom");
        btnCustom.alignment = ["left", "bottom"];
        btnCustom.onClick = function () {
            var code = customInput.text;
            if (code && code.length > 0) {
                try {
                    eval(code);
                } catch (err) {
                    alert(
                        "ERROR DETAILS:\n" +
                        "Message: " + err.toString() + "\n" +
                        "Name: " + (err.name || "N/A") + "\n" +
                        "Line: " + (err.line || "N/A") + "\n" +
                        "Stack: " + (err.stack || "N/A")
                    );
                }
            } else {
                alert("Enter some code to run.");
            }
        };

        // Layout handling
        if (myPanel instanceof Window) {
            // Resize / layout on resize or resizing
            myPanel.onResizing = myPanel.onResize = function () {
                this.layout.resize();
            };
            // Additional code on show to force layout and possibly apply sizing settings
            myPanel.onShow = function () {
                // Attempt to reset or assert sizing constraints after open
                customInput.minimumSize = [100, 30];
                customInput.preferredSize = [400, 100];
                this.layout.layout(true);
            };
        }

        return myPanel;
    }

    var win = buildUI(thisObj);
    if (win instanceof Window) {
        win.center();
        win.show();
    } else {
        // Panel case
        win.layout.layout(true);
        // Probably also resize layout just in case
        win.layout.resize();
    }

})(this);
