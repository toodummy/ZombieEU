extends CharacterBody3D

const G = preload("res://scripts/geometry.gd")
const MAX_FUEL := 25.0

var speed := 0.0
var fuel := 4.4
var hull := 100.0
var wheel_condition := 100.0
var impact := 0.0
var impact_cooldown := 0.0
var wheels: Array[Node3D] = []
var front_hubs: Array[Node3D] = []
var headlights: Array[SpotLight3D] = []
var tail: StandardMaterial3D
var driver_enabled := true

func _ready() -> void:
	# Floating mode uses planar collision and leaves curb styling separate.
	motion_mode = CharacterBody3D.MOTION_MODE_FLOATING
	G.body_shape(self,Vector3(0,0.69,0),Vector3(1.86,1.07,4.40))
	build_model()

func build_model() -> void:
	var coat := G.material(Color("#8c6852"), 0.37, 0.70)
	var trim := G.material(Color("#292f31"),0.48,0.38)
	var alloy := G.material(Color("#a2a8a4"),0.31,0.75)
	var rubber := G.material(Color("#222528"),0.98)
	var glass := G.material(Color("#324649"),0.16,0.52)
	var lens := G.material(Color("#f5ecd1"),0.32,0.2,1.1)
	tail = G.material(Color("#e66448"),0.35,0.1,0.65)
	body_profile([
		Vector4(-2.30,0.79,0.78,0.39),Vector4(-1.91,0.94,0.99,0.38),
		Vector4(-1.23,0.98,0.99,0.37),Vector4(1.39,0.99,0.99,0.37),
		Vector4(1.99,0.86,0.96,0.40),Vector4(2.28,0.77,0.84,0.43)],coat)
	body_profile([
		Vector4(-1.06,0.98,0.86,0.94),Vector4(-0.59,1.54,0.76,0.93),
		Vector4(0.63,1.55,0.76,0.93),Vector4(1.37,1.02,0.84,0.95)],glass)
	body_profile([
		Vector4(-0.71,1.53,0.76,1.48),Vector4(-0.53,1.59,0.75,1.48),
		Vector4(0.64,1.59,0.75,1.48),Vector4(0.83,1.53,0.74,1.48)],coat)
	G.box(self,Vector3(0,0.49,2.24),Vector3(1.75,0.16,0.19),trim)
	G.box(self,Vector3(0,0.69,2.239),Vector3(0.51,0.15,0.11),alloy)
	G.label(self,Vector3(0,0.68,2.303),"LON 071",0.11,Color("#2c2422"))
	G.box(self,Vector3(0,0.62,-2.26),Vector3(1.74,0.18,0.18),trim)
	for side in [-1.0,1.0]:
		G.box(self,Vector3(side * 0.66,0.70,2.24),Vector3(0.34,0.14,0.12),tail)
		G.box(self,Vector3(side * 0.64,0.75,-2.26),Vector3(0.39,0.17,0.09),lens)
		G.box(self,Vector3(side*1.04,1.14,-0.80),Vector3(0.27,0.13,0.25),trim)
		G.box(self,Vector3(side*0.85,1.21,0.08),Vector3(0.045,0.51,0.10),trim).rotation.z = side * 0.18
		for z in [-0.20,0.89]:
			G.box(self,Vector3(side*0.994,0.89,z),Vector3(0.018,0.035,0.16),alloy)
		for z in [-1.43,1.45]:
			var hub := Node3D.new()
			hub.position = Vector3(side * 0.89,0.39,z)
			add_child(hub)
			if z < 0:
				front_hubs.append(hub)
			var axle := Node3D.new()
			hub.add_child(axle)
			wheels.append(axle)
			G.tube(axle,Vector3.ZERO,0.385,0.29,rubber).rotation.z = PI/2
			G.tube(axle,Vector3(side * 0.15,0,0),0.256,0.026,alloy).rotation.z = PI/2
			G.tube(axle,Vector3(side * 0.17,0,0),0.200,0.027,trim).rotation.z = PI/2
			for spoke in range(6):
				var angle := TAU * spoke / 6.0
				G.box(axle,Vector3(side*0.19,cos(angle)*0.1,sin(angle)*0.1),Vector3(0.035,0.2,0.038),alloy).rotation.x = angle
		var beam := SpotLight3D.new()
		beam.position = Vector3(side * 0.64,0.76,-2.45)
		beam.rotation.x = -0.08
		beam.light_color = Color("#ffedcd")
		beam.light_energy = 2.05
		beam.spot_range = 28
		beam.spot_angle = 29.0
		add_child(beam)
		headlights.append(beam)

func body_profile(profile: Array, surface: Material) -> void:
	var rings: Array[PackedVector3Array] = []
	for row: Vector4 in profile:
		rings.append(PackedVector3Array([
			Vector3(-row.z*0.88,row.w,row.x),Vector3(-row.z,row.w+0.07,row.x),
			Vector3(-row.z*0.96,row.y-0.07,row.x),Vector3(-row.z*0.77,row.y,row.x),
			Vector3(row.z*0.77,row.y,row.x),Vector3(row.z*0.96,row.y-0.07,row.x),
			Vector3(row.z,row.w+0.07,row.x),Vector3(row.z*0.88,row.w,row.x)]))
	var shape := SurfaceTool.new()
	shape.begin(Mesh.PRIMITIVE_TRIANGLES)
	for i in range(rings.size()-1):
		for j in range(8):
			var k := (j+1)%8
			triangle(shape,rings[i][j],rings[i+1][j],rings[i][k])
			triangle(shape,rings[i][k],rings[i+1][j],rings[i+1][k])
	for j in range(1,7):
		triangle(shape,rings[0][0],rings[0][j],rings[0][j+1])
		triangle(shape,rings[-1][0],rings[-1][j+1],rings[-1][j])
	shape.generate_normals()
	var double_sided := surface.duplicate() as StandardMaterial3D
	double_sided.cull_mode = BaseMaterial3D.CULL_DISABLED
	G.mesh(self,shape.commit(),Vector3.ZERO,double_sided)

func triangle(shape: SurfaceTool, a: Vector3, b: Vector3, c: Vector3) -> void:
	shape.add_vertex(a)
	shape.add_vertex(b)
	shape.add_vertex(c)

func drive(delta: float, throttle: float, steering: float, handbrake: bool, wet_lane: bool) -> void:
	impact = 0.0
	impact_cooldown = maxf(impact_cooldown-delta,0)
	var powered := driver_enabled and fuel > 0.0 and hull > 0.0
	var grip := remap(wheel_condition,0,100,0.54,1.0)
	if wet_lane:
		grip *= 0.73
	var against_motion := (throttle < -0.15 and speed > 0.6) or (throttle > 0.15 and speed < -0.6)
	if handbrake or against_motion:
		speed = move_toward(speed,0, (19.0 if handbrake else 14.0)*delta)
	elif powered and absf(throttle) > 0.05:
		var max_forward := lerpf(10,27,hull/100.0)
		speed = move_toward(speed, (max_forward if throttle > 0 else 6.1)*throttle, 8.35 * delta)
	else:
		speed = move_toward(speed,0, (2.6 if powered else 3.7)*delta)
	if absf(speed) > 0.15:
		var rate := clampf(absf(speed)/3.0,0.0,1.0)*lerpf(1.74,0.84,clampf(absf(speed)/25.0,0.0,1.0))
		rotation.y += steering * rate * grip * signf(speed) * delta
	var forward := -global_basis.z
	var blend := 1.0-exp(-delta*(13.0 if handbrake else 11.0)*grip)
	velocity = velocity.lerp(forward * speed,blend)
	var contact := move_and_collide(velocity * delta)
	if contact:
		var severity := maxf(0.0,-velocity.dot(contact.get_normal()))
		if severity > 2.6 and impact_cooldown <= 0.0:
			hull = maxf(0.0,hull-severity*1.47)
			wheel_condition = maxf(0.0,wheel_condition-severity*1.22)
			impact = severity
			impact_cooldown = 0.36
		velocity = velocity.slide(contact.get_normal()) * 0.53
		speed *= clampf(1.0-severity/12.0,0.07,0.78)
	if powered:
		fuel = maxf(0.0,fuel-delta*(0.012+absf(speed)*0.019))
	for hub in front_hubs:
		hub.rotation.y = lerpf(hub.rotation.y, steering*0.36, minf(1,8*delta))
	for wheel in wheels:
		wheel.rotation.x = wrapf(wheel.rotation.x - speed * delta / 0.385,-PI,PI)
	tail.emission_energy_multiplier = 1.9 if handbrake or against_motion else 0.62
