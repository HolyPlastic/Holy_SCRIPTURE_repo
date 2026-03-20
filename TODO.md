# Holy Scripture — To-Do List

## Slots

- [ ] **Save-to-slot: show existing slots and allow overwrite**
  When saving content into a slot, present a list of existing slots so the user can choose to overwrite one rather than always creating a new entry.

- [ ] **Save-to-slot: export to local file**
  Add an extra option when saving a slot to export it as a `.jsx` file to a user-chosen location. Should open a native OS file-save dialog (find/browse window) so the user can pick the destination folder and filename.

- [ ] **Slots panel: draggable entries**
  Make slot entries draggable so users can resize/reposition the slots panel and see more content depending on how they arrange the windows.

---

## Editor & Library Integration

- [ ] **Link editor to library — show current library entry name**
  When a library script is loaded into the editor, display its library entry name prominently (replacing or alongside the current comp name display). This identifies which library entry is being edited.

- [ ] **Consistent naming across panels**
  Script names should be synchronized across editor, slots, and library panels. If a name changes in any panel, it should update in all three places.

- [ ] **Save button: three options**
  The save button should always offer three choices:
  1. **Overwrite** — if the script is already a library entry, overwrite it
  2. **Save as new** — save as a new library entry
  3. **Export to local file** — save to user-chosen local location

- [ ] **Quick overwrite for library entries**
  If the current editor content is from the library, provide a prominent way to overwrite it (maybe a dedicated button near the library name display).

- [ ] **Library dropdown in editor**
  Add a dropdown selector in the editor to quickly switch between different library entries.

- [ ] **Unsaved changes warning**
  When swapping library entries without saving, show a styled panel popup (not an After Effects modal) warning about unsaved changes.

- [ ] **Reorganize editor header layout**
  Move comp info (comp name, frame rate, layers, timecode) to the very top row next to "Holy Scripture" branding. Replace the current comp name display with the library script name display. Include a save button there as well.

---

## Storage & Export

- [ ] **JSON storage export/import**
  Integrate local JSON file export/import to allow users to backup and restore library, slots, history, and macros data outside of the CEP localStorage system.

---

## Library

- [ ] *(add library-specific tasks here)*

---

## General / Polish

- [ ] **Mouse scroll in tab panels**
  Enable mouse wheel scrolling across all tab content areas (editor, slots, library, history). Users should be able to scroll with their mouse when browsing content within each tab.

- [ ] *(add general tasks here)*
