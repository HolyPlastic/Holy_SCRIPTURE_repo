/**
 * HOLY SCRIPTURE — hostscript.jsx
 * ExtendScript running inside After Effects.
 * All functions prefixed HS_ to avoid collisions with user scripts.
 */

// ============================================================
// HS_runScript
// Evaluates user code inside an IIFE so `return` statements work.
// Returns JSON string: { success, output, logs, error }
// Users can call log("msg") inside their scripts to surface output.
// ============================================================
function HS_runScript(codeStr) {
    var result = {
        success: false,
        output: "",
        logs: [],
        error: null
    };

    // Inject a log() helper so users can capture output without alert()
    var __hsLogs = [];
    $.global.log = function(msg) {
        __hsLogs.push(String(msg));
    };

    try {
        var val = eval("(function(){\n" + codeStr + "\n})()");
        result.success = true;
        result.logs = __hsLogs;
        if (val !== undefined && val !== null) {
            result.output = String(val);
        }
    } catch (e) {
        result.success = false;
        result.logs = __hsLogs;
        result.error = {
            message: e.toString(),
            name: e.name ? String(e.name) : "Error",
            line: e.line ? String(e.line) : "N/A",
            stack: e.stack ? String(e.stack) : ""
        };
    }

    // Clean up global injection
    try { delete $.global.log; } catch(e) {}

    return JSON.stringify(result);
}


// ============================================================
// HS_getContext
// Returns current AE project/comp state for the context bar.
// Always returns valid JSON — never throws to CEP side.
// ============================================================
function HS_getContext() {
    var ctx = {
        hasComp: false,
        compName: "",
        fps: "",
        duration: "",
        selectedLayers: 0,
        timecode: "00:00:00:00",
        projectName: ""
    };

    try {
        if (app.project) {
            ctx.projectName = app.project.file ? app.project.file.name : "UNTITLED";
        }

        var comp = app.project.activeItem;
        if (comp && (comp instanceof CompItem)) {
            ctx.hasComp = true;
            ctx.compName = comp.name;
            ctx.fps = Math.round(comp.frameRate * 100) / 100;
            ctx.duration = comp.duration.toFixed(2) + "s";
            ctx.selectedLayers = comp.selectedLayers.length;

            // Build SMPTE timecode from current time
            var time = comp.time;
            var fr = comp.frameRate;
            var totalFrames = Math.floor(time * fr);
            var h = Math.floor(totalFrames / (fr * 3600));
            totalFrames -= Math.floor(h * fr * 3600);
            var m = Math.floor(totalFrames / (fr * 60));
            totalFrames -= Math.floor(m * fr * 60);
            var s = Math.floor(totalFrames / fr);
            totalFrames -= Math.floor(s * fr);
            var f = Math.round(totalFrames);

            function pad(n) { return (n < 10 ? "0" : "") + n; }
            ctx.timecode = pad(h) + ":" + pad(m) + ":" + pad(s) + ":" + pad(f);
        }
    } catch (e) {
        // Fail silently — context bar just shows defaults
    }

    return JSON.stringify(ctx);
}


// ============================================================
// HS_getVersion
// Returns AE version string for about info.
// ============================================================
function HS_getVersion() {
    try {
        return app.version;
    } catch(e) {
        return "unknown";
    }
}
