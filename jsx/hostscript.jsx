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

function HS_parseJsonSafe(jsonStr, fallback) {
    try {
        if (jsonStr === null || jsonStr === undefined || jsonStr === "") return fallback;
        return JSON.parse(jsonStr);
    } catch (e) {
        return fallback;
    }
}

function HS_resolveMacroStep(step, index, libraryScripts) {
    var resolved = {
        index: index,
        id: step && step.id ? String(step.id) : ("step_" + index),
        scriptId: step && step.scriptId ? String(step.scriptId) : "",
        name: step && step.name ? String(step.name) : ("STEP " + (index + 1)),
        code: step && step.code ? String(step.code) : "",
        delay: step && step.delay ? parseInt(step.delay, 10) || 0 : 0
    };

    if (resolved.scriptId && libraryScripts && libraryScripts.length) {
        var i;
        for (i = 0; i < libraryScripts.length; i++) {
            if (String(libraryScripts[i].id) === resolved.scriptId) {
                resolved.name = libraryScripts[i].name ? String(libraryScripts[i].name) : resolved.name;
                resolved.code = libraryScripts[i].code ? String(libraryScripts[i].code) : resolved.code;
                break;
            }
        }
    }

    return resolved;
}

// ============================================================
// HS_runMacro
// Loads a saved macro from Holy Scripture storage and executes
// its steps in order via HS_runScript(). Returns JSON string:
// { success, steps: [{ id, success, output, logs } | { id, success, error }] }
// ============================================================
function HS_runMacro(macroId) {
    var result = {
        success: false,
        steps: []
    };

    try {
        var macroIdStr = macroId ? String(macroId) : "";
        if (!macroIdStr) {
            return JSON.stringify(result);
        }

        var macros = HS_parseJsonSafe(HS_loadData("hs_macros"), []);
        var libraryData = HS_parseJsonSafe(HS_loadData("hs_library"), { scripts: [] });
        var libraryScripts = (libraryData && libraryData.scripts) ? libraryData.scripts : [];
        var macro = null;
        var i;

        for (i = 0; i < macros.length; i++) {
            if (String(macros[i].id) === macroIdStr) {
                macro = macros[i];
                break;
            }
        }

        if (!macro) {
            return JSON.stringify(result);
        }

        var onError = macro.onError === "continue" ? "continue" : "abort";

        if (!macro.steps || !macro.steps.length) {
            return JSON.stringify(result);
        }

        for (i = 0; i < macro.steps.length; i++) {
            var resolvedStep = HS_resolveMacroStep(macro.steps[i], i, libraryScripts);
            var stepResult;

            if (!resolvedStep.code) {
                stepResult = {
                    id: resolvedStep.scriptId || resolvedStep.id,
                    success: false,
                    error: "Macro step has no code."
                };
            } else {
                var rawStepResult = HS_runScript(resolvedStep.code);
                var parsedStepResult = HS_parseJsonSafe(rawStepResult, null);

                if (!parsedStepResult) {
                    stepResult = {
                        id: resolvedStep.scriptId || resolvedStep.id,
                        success: false,
                        error: "Could not parse macro step result."
                    };
                } else {
                    stepResult = {
                        id: resolvedStep.scriptId || resolvedStep.id,
                        success: !!parsedStepResult.success
                    };
                    if (stepResult.success) {
                        stepResult.output = parsedStepResult.output ? String(parsedStepResult.output) : "";
                        stepResult.logs = parsedStepResult.logs || [];
                    } else {
                        stepResult.error = parsedStepResult.error && parsedStepResult.error.message
                            ? String(parsedStepResult.error.message)
                            : "Macro step failed.";
                    }
                }
            }

            result.steps.push(stepResult);

            if (!stepResult.success && onError === "abort") {
                break;
            }
        }

        result.success = true;
        for (i = 0; i < result.steps.length; i++) {
            if (!result.steps[i].success) {
                result.success = false;
                break;
            }
        }
    } catch (e) {
        result.success = false;
        result.steps.push({
            id: macroId ? String(macroId) : "macro",
            success: false,
            error: e.toString()
        });
    }

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


// ============================================================
// HS_getDataDir
// Returns the path to the Holy Scripture data folder in the
// user's AppData/Roaming directory. Creates the folder chain
// if it doesn't exist. Uses forward slashes — cep.fs accepts
// these on Windows.
// ============================================================
function HS_getDataDir() {
    try {
        var base   = Folder.userData.fullName; // e.g. /C/Users/Ben/AppData/Roaming
        var parent = new Folder(base + "/Holy Storage");
        var child  = new Folder(base + "/Holy Storage/Holy_Scripture");
        if (!parent.exists) parent.create();
        if (!child.exists)  child.create();
        return child.fullName;
    } catch(e) {
        return "";
    }
}


// ============================================================
// HS_saveData / HS_loadData
// Key-value file persistence in the Holy Scripture data dir.
// Each key maps to a .json file, e.g. hs_library.json.
// HS_saveData with value=null deletes the file.
// ============================================================
function HS_saveData(key, jsonStr) {
    try {
        var dir  = HS_getDataDir();
        if (!dir) return "ERROR:no_dir";
        var file = new File(dir + "/" + key + ".json");
        if (jsonStr === null || jsonStr === "null") {
            if (file.exists) file.remove();
            return "OK:deleted";
        }
        file.open("w");
        file.encoding = "UTF-8";
        file.write(jsonStr);
        file.close();
        return "OK";
    } catch(e) {
        return "ERROR:" + e.toString();
    }
}

function HS_loadData(key) {
    try {
        var dir  = HS_getDataDir();
        if (!dir) return null;
        var file = new File(dir + "/" + key + ".json");
        if (!file.exists) return null;
        file.open("r");
        file.encoding = "UTF-8";
        var content = file.read();
        file.close();
        return content;
    } catch(e) {
        return null;
    }
}

function HS_getMacros() {
    var result = {
        success: false,
        macros: []
    };

    try {
        var macros = HS_parseJsonSafe(HS_loadData("hs_macros"), []);
        var i;

        for (i = 0; i < macros.length; i++) {
            result.macros.push({
                id: macros[i].id ? String(macros[i].id) : "",
                name: macros[i].name ? String(macros[i].name) : "MACRO",
                stepCount: macros[i].steps ? macros[i].steps.length : 0,
                onError: macros[i].onError === "continue" ? "continue" : "abort",
                created: macros[i].created ? parseInt(macros[i].created, 10) || 0 : 0
            });
        }

        result.success = true;
    } catch (e) {
        result.success = false;
    }

    return JSON.stringify(result);
}

function HS_getAgentScripts() {
    var result = {
        success: false,
        scripts: [],
        error: null
    };

    try {
        var library = HS_parseJsonSafe(HS_loadData("hs_agent_library"), { scripts: [] });
        var scripts = (library && library.scripts) ? library.scripts : [];
        var i;

        for (i = 0; i < scripts.length; i++) {
            result.scripts.push({
                id: scripts[i].id ? String(scripts[i].id) : "",
                name: scripts[i].name ? String(scripts[i].name) : "",
                description: scripts[i].description ? String(scripts[i].description) : "",
                category: scripts[i].category ? String(scripts[i].category) : "",
                readOnly: scripts[i].readOnly === true,
                argsSchema: scripts[i].argsSchema || {}
            });
        }

        result.success = true;
    } catch (e) {
        result.error = {
            message: e.toString(),
            name: e.name ? String(e.name) : "Error",
            line: e.line ? String(e.line) : "N/A",
            stack: e.stack ? String(e.stack) : ""
        };
    }

    return JSON.stringify(result);
}

function HS_runAgentScript(id, argsJson) {
    var result = {
        success: false,
        output: "",
        logs: [],
        error: null
    };

    try {
        var library = HS_parseJsonSafe(HS_loadData("hs_agent_library"), { scripts: [] });
        var scripts = (library && library.scripts) ? library.scripts : [];
        var target = null;
        var idStr = id ? String(id) : "";
        var i;

        for (i = 0; i < scripts.length; i++) {
            if (String(scripts[i].id) === idStr) {
                target = scripts[i];
                break;
            }
        }

        if (!target || !target.code) {
            result.error = {
                message: "Agent script not found: " + idStr,
                name: "MissingAgentScript",
                line: "N/A",
                stack: ""
            };
        } else {
            $.global.__holyScriptureAgentArgs = HS_parseJsonSafe(argsJson, {});
            var raw = HS_runScript(String(target.code));
            var parsed = HS_parseJsonSafe(raw, null);

            if (!parsed) {
                result.error = {
                    message: "Could not parse agent script result.",
                    name: "ParseError",
                    line: "N/A",
                    stack: ""
                };
            } else {
                result = parsed;
                result.scriptId = idStr;

                if (parsed.success) {
                    var payload = HS_parseJsonSafe(parsed.output, null);
                    if (payload && typeof payload === "object") {
                        result.data = payload;
                        if (payload.success === false) {
                            result.success = false;
                            result.output = payload.message ? String(payload.message) : "";
                            result.error = {
                                message: payload.error ? String(payload.error) : "Agent script failed.",
                                name: "AgentScriptError",
                                line: payload.line ? String(payload.line) : "N/A",
                                stack: ""
                            };
                        } else {
                            result.output = payload.message ? String(payload.message) : (parsed.output ? String(parsed.output) : "");
                        }
                    }
                }
            }
        }
    } catch (e) {
        result.success = false;
        result.error = {
            message: e.toString(),
            name: e.name ? String(e.name) : "Error",
            line: e.line ? String(e.line) : "N/A",
            stack: e.stack ? String(e.stack) : ""
        };
    }

    try { delete $.global.__holyScriptureAgentArgs; } catch (cleanupErr) {}

    return JSON.stringify(result);
}


// ============================================================
// HS_exportScript
// Writes a .jsx file to the Holy Scripture data dir.
// Named after the script — spaces become underscores.
// ============================================================
function HS_exportScript(name, code) {
    try {
        var dir  = HS_getDataDir();
        if (!dir) return "ERROR:no_dir";
        var safe = name.replace(/[^A-Za-z0-9_\-]/g, "_");
        var file = new File(dir + "/" + safe + ".jsx");
        file.open("w");
        file.encoding = "UTF-8";
        file.write(code);
        file.close();
        return "OK:" + file.fullName;
    } catch(e) {
        return "ERROR:" + e.toString();
    }
}
