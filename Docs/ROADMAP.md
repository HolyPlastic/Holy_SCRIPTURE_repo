# Roadmap

Unimplemented features from the original design intent. Not bugs — planned work.

*Before implementing anything new, check this file. Items here have design intent attached. Don't implement them differently without flagging the deviation.*

---

## Library & Slots Synchronization (Top Priority)

Untangling the UX and data flow between the Editor, Slots, and Library so they act as a unified system rather than isolated clipboards.

- Link the editor to the library: Display the active library entry name prominently directly above the editor. if it's not a saved entry then just say "Unsaved".
- Synchronize script names across the editor, slots, and library panels. If changed in one, it updates in all three.
- Add a dropdown selector in the Editor header to quickly switch between library entries.
- Unsaved changes warning: If swapping library entries without saving, show a styled panel popup (not a native AE modal) warning the user.

**Why:** Currently, saving to a slot just copies the string rather than linking to a library item. This creates a disconnected UX where updating a script doesn't update its quick-access slot.
**Notes:** Do not use native ExtendScript `alert()` or `confirm()` for warnings. Use the custom HTML/CSS modal system, This may tie into the below heading "SAVING". So worth reading that as well before implementing all of this. They might need to be one thing, or might be more efficient as one thing, I don't really know. Same goes for all the roadmap entries, really, but I'm pretty sure these two are probably linked.

## SAVING
Currently all info/scripts etc is saved to the cep cache created by AE, it should instead be saved to a local user folder "/Holy Storage/Holy_Scripture" So these are in app data roaming in the roaming folder there. I think that's a good place for them. I'm not writing my full path because I don't want it to be hard coded into the plugin. It should automatically go into the user's app data roaming folder. I bel I I'm not sure the best way to do that. but I believe you could do it via extend script, something like this, Just a quick example, but I'm really not sure about it. It'll need checking. I'll just put it here as an example. But I'm not 100% confident in it.- 

var folder = Folder(Folder.userData.fullName + "/Holy Storage/Holy_Scripture");
if (!folder.exists) folder.create();

var file = File(folder.fullName + "/data.json");
file.open("w");
file.write('{"test":123}');
file.close();

---

## Editor Save & Header Reorganization

Improving the save flow and reorganizing the top bar for better hierarchy.

- The Save button should always offer three explicit choices: Overwrite (if loaded from library), Save As New, and Export to Local File.
- Add a prominent "Quick Overwrite" button near the library name display for existing library entries.
- Move comp info (name, fps, layers, timecode) to the very top row next to the branding.
- Replace the current comp name display in the Editor tab with the active Library Script name.

**Why:** The current save flow is rigid. Users need clear options to fork scripts, overwrite them safely, or export them to their OS. 


---

## Drag and Drop File Import

Allow users to drag `.jsx`, `.js`, and `.txt` files directly into the panel to load them into the Editor.

- Display a visual overlay reading `DROP .JSX / .TXT HERE` when dragging files over the panel.
- Parse the dropped file and load its contents into CodeMirror.

**Why:** Faster workflow for users migrating existing scripts into the Holy Scripture library.
**Notes:** The visual overlay code currently exists in a dormant state (`hlm-dragdrop.js` / style elements), but the file reader and drop zone logic need hooking up.

---

## ~~General UI Polish~~

- ~~**Mouse scroll in tab panels:** Enable mouse wheel scrolling across all tab content areas (editor, slots, library, history).~~
- ~~**Draggable Slot Entries:** Make slot entries draggable so users can resize/reposition them to fit their panel arrangement.~~
- ~~Currently the slot entries are just a vertical layout, but it would be nice to be able to stack them next to each other as well, horizontally, if the user chooses to. So idea in an ideal world they could drag one above or below a different slot or to the right or left of an existing slot. And stack them any way they like.~~

~~**Why:** Desktop-class interactions are expected in a professional AE tool.~~

---

## Phase 7 & 8: Params and Macros

Fleshing out the undeveloped tabs visible in the UI.

- **Params:** Allow users to define user-facing variables at the top of a script that can be tweaked via UI inputs before casting, without editing the raw code.
- **Macros:** Allow users to chain multiple saved library scripts together to run sequentially as a single action.

**Why:** Elevates the plugin from a simple code executor to a visual script builder.
**Notes:** The UI structure for these exists in `index.html` and `style.css`, but the logic in `main.js` is currently a placeholder.

---


## Local JSON Export/Import

Escaping the constraints of CEP `localStorage`.

- Integrate local JSON file export/import.
- Allow users to backup and restore their entire Library, Slots, History, and Macros data.

**Why:** `localStorage` is volatile. If the user clears their CEP cache or moves to a new machine, they lose their scripts. They need a hard backup mechanism.
**Notes:** Use native OS file-save/browse dialogs (via ExtendScript `File` object or CEP `window.cep.fs`) to pick the destination folder.

## Open Design Questions

*Unresolved decisions. An agent should not make these calls unilaterally — flag them to the user.*

- **Storage Engine Migration:** If JSON export/import is built, should the primary persistence engine move to reading/writing from a local `.json` file by default instead of `localStorage`?