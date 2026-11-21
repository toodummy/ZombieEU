extends RefCounted

static func material(color: Color, roughness := 0.78, metallic := 0.0, emission := 0.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.roughness = roughness
	m.metallic = metallic
	if emission > 0.0:
		m.emission_enabled = true
		m.emission = color
		m.emission_energy_multiplier = emission
	return m

static func mesh(parent: Node3D, shape: Mesh, at: Vector3, surface: Material) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.mesh = shape
	node.material_override = surface
	node.position = at
	parent.add_child(node)
	return node

static func box(parent: Node3D, at: Vector3, size: Vector3, surface: Material, solid := false) -> MeshInstance3D:
	var shape := BoxMesh.new()
	shape.size = size
	var part := mesh(parent, shape, at, surface)
	if solid:
		part.create_trimesh_collision()
	return part

static func tube(parent: Node3D, at: Vector3, radius: float, height: float, surface: Material, tip := -1.0) -> MeshInstance3D:
	var shape := CylinderMesh.new()
	shape.bottom_radius = radius
	shape.top_radius = radius if tip < 0.0 else tip
	shape.height = height
	shape.radial_segments = 12
	shape.rings = 0
	return mesh(parent, shape, at, surface)

static func ellipsoid(parent: Node3D, at: Vector3, size: Vector3, surface: Material) -> MeshInstance3D:
	var shape := SphereMesh.new()
	shape.radial_segments = 12
	shape.rings = 6
	var part := mesh(parent, shape, at, surface)
	part.scale = size
	return part

static func label(parent: Node3D, at: Vector3, caption: String, size: float, color: Color, yaw := 0.0) -> Label3D:
	var plate := Label3D.new()
	plate.text = caption
	plate.position = at
	plate.rotation.y = yaw
	plate.font_size = 64
	plate.pixel_size = size / 64.0
	plate.modulate = color
	plate.outline_size = 0
	plate.shaded = false
	plate.double_sided = false
	parent.add_child(plate)
	return plate

static func body_shape(body: CollisionObject3D, at: Vector3, size: Vector3) -> void:
	var shape := BoxShape3D.new()
	shape.size = size
	var collider := CollisionShape3D.new()
	collider.position = at
	collider.shape = shape
	body.add_child(collider)
