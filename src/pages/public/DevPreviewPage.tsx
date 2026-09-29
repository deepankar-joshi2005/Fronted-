import { useState } from "react";
import Modal from "../../components/ui/Modal.jsx";
import Switch from "../../components/ui/Switch.jsx";
import { STAFF_MODULES, DEFAULT_MODULE_PERMISSIONS } from "../../config/modulePermissions.js";

export default function DevPreviewPage() {
  const [permissions, setPermissions] = useState(DEFAULT_MODULE_PERMISSIONS);

  function updateModule(moduleKey, patch) {
    setPermissions((p) => ({ ...p, [moduleKey]: { ...p[moduleKey], ...patch } }));
  }

  return (
    <Modal open onClose={() => {}} title="Add a staff member" size="lg">
      <div>
        <p className="text-sm font-medium text-text">Module permissions</p>
        <p className="mt-0.5 text-xs text-text-muted">
          Only enabled modules show up in this staff member's sidebar. Add/edit/delete control what they can do
          inside each one.
        </p>
        <div className="mt-3 flex flex-col gap-3">
          {STAFF_MODULES.map(({ key, label }) => {
            const mod = permissions[key] || DEFAULT_MODULE_PERMISSIONS[key];
            return (
              <div key={key} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-text">{label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">{mod.enabled ? "Shown" : "Hidden"}</span>
                    <Switch checked={!!mod.enabled} onChange={(checked) => updateModule(key, { enabled: checked })} />
                  </div>
                </div>
                {mod.enabled && (
                  <div className="mt-3 flex flex-wrap gap-4">
                    {["add", "edit", "delete"].map((action) => (
                      <label key={action} className="flex items-center gap-2 text-sm text-text">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border"
                          checked={!!mod[action]}
                          onChange={(e) => updateModule(key, { [action]: e.target.checked })}
                        />
                        {action === "add" ? "Add" : action === "edit" ? "Edit" : "Delete"}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
