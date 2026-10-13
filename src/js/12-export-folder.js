// ===== The Export folder: client packages and live tours are written into "Export" next to the Studio, apart from the program's own files =====
/*@STUDIO*/
// create = true: Export\<name> (both made when missing). create = false: Export\<name>, or the older place <name> right next to the Studio.
async function exportDir(root, name, create) {
  if (create) return (await root.getDirectoryHandle('Export', { create:true })).getDirectoryHandle(name, { create:true });
  try { return await (await root.getDirectoryHandle('Export')).getDirectoryHandle(name); } catch (err) {}
  return root.getDirectoryHandle(name);   // throws NotFoundError when neither exists, like a plain lookup
}
/*@/STUDIO*/
