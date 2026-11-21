extends RefCounted

const PRIMARY := "user://london_checkpoint.save"
const BACKUP := "user://london_checkpoint.bak"
const PENDING := "user://london_checkpoint.tmp"
const VERSION := 1

static func read() -> Dictionary:
	for path in [PRIMARY,BACKUP]:
		var file := FileAccess.open(path,FileAccess.READ)
		if not file:
			continue
		var candidate: Variant = file.get_var(false)
		if typeof(candidate) == TYPE_DICTIONARY and valid(candidate):
			return candidate
	return {}

static func valid(data: Dictionary) -> bool:
	if data.get("version") != VERSION or data.get("id") not in ["safehouse","forecourt"]:
		return false
	if typeof(data.get("rescued",false)) != TYPE_BOOL:
		return false
	if not data.has_all(["position","yaw","fuel","hull","wheel"]):
		return false
	if typeof(data.position) != TYPE_VECTOR3 or not data.position.is_finite():
		return false
	for property in ["yaw","fuel","hull","wheel"]:
		if typeof(data[property]) not in [TYPE_FLOAT,TYPE_INT] or not is_finite(data[property]):
			return false
	return absf(data.position.x) < 40 and data.position.z <= 29 and data.position.z >= -254 and absf(data.position.y) < 0.5 		and data.fuel >= 0 and data.fuel <= 25 and data.hull > 0 and data.hull <= 100 and data.wheel >= 0 and data.wheel <= 100

static func write(data: Dictionary) -> Error:
	if not valid(data):
		return ERR_INVALID_DATA
	var file := FileAccess.open(PENDING, FileAccess.WRITE)
	if not file:
		return FileAccess.get_open_error()
	file.store_var(data, false)
	file.flush()
	var write_error := file.get_error()
	file.close()
	if write_error != OK:
		return write_error
	var base := ProjectSettings.globalize_path("user://")
	if FileAccess.file_exists(PRIMARY):
		var rotate := DirAccess.rename_absolute(base.path_join(PRIMARY.get_file()),base.path_join(BACKUP.get_file()))
		if rotate != OK:
			return rotate
	return DirAccess.rename_absolute(base.path_join(PENDING.get_file()),base.path_join(PRIMARY.get_file()))
