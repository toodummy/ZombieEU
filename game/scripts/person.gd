extends CharacterBody3D

const G = preload("res://scripts/geometry.gd")
var infected := false
var screamer := false
var stride := 0.0
var limbs: Array[Node3D] = []
var figure: Node3D
var idle_position: Vector3
var attack_timer := 0.0
var stagger := 0.0
var knockback := Vector3.ZERO

func _ready() -> void:
	motion_mode = CharacterBody3D.MOTION_MODE_FLOATING
	collision_layer = 0
	G.body_shape(self,Vector3(0,0.85,0),Vector3(0.51,1.60,0.50))
	figure = Node3D.new()
	add_child(figure)
	idle_position = position
	build_model()

func build_model() -> void:
	var skin := G.material(Color("#a68f75") if not infected else Color("#8c9880"))
	var coat := G.material(Color("#55544b") if not infected else (Color("#95754b") if screamer else Color("#454f48")))
	var trousers := G.material(Color("#343d3e") if not infected else Color("#414341"))
	var boots := G.material(Color("#262725"))
	var webbing := G.material(Color("#66533f"))
	var hair := G.material(Color("#38362f"))
	var body := G.ellipsoid(figure,Vector3(0,1.24,0),Vector3(0.54,0.62,0.34),coat)
	body.rotation.x = -0.10 if infected else 0.02
	G.tube(figure,Vector3(0,1.57,-0.013),0.084,0.14,skin)
	G.ellipsoid(figure,Vector3(0,1.738,-0.041),Vector3(0.26,0.33,0.25),skin)
	G.ellipsoid(figure,Vector3(0,1.81,-0.016),Vector3(0.269,0.213,0.233),hair)
	G.ellipsoid(figure,Vector3(0,1.72,-0.162),Vector3(0.081,0.096,0.092),skin)
	if not infected:
		G.box(figure,Vector3(0,1.23,0.205),Vector3(0.35,0.43,0.20),webbing)
		for x in [-0.13,0.13]:
			G.box(figure,Vector3(x,1.28,-0.156),Vector3(0.045,0.44,0.035),webbing).rotation.z = x
	if screamer:
		G.box(figure,Vector3(0,1.42,-0.152),Vector3(0.31,0.07,0.039),G.material(Color("#d6a867"),0.7,0,0.26))
	for side in [-1.0, 1.0]:
		var leg := joint(Vector3(side*0.13,0.89,0))
		G.ellipsoid(leg,Vector3(0,-0.27,0),Vector3(0.22,0.59,0.22),trousers)
		G.ellipsoid(leg,Vector3(0,-0.63,0.013),Vector3(0.174,0.46,0.18),trousers)
		G.box(leg,Vector3(0,-0.8,-0.042),Vector3(0.175,0.14,0.29),boots)
		var arm := joint(Vector3(side*0.26,1.42,0))
		arm.rotation.z = side*0.14
		G.ellipsoid(arm,Vector3(0,-0.19,0),Vector3(0.18,0.41,0.18),coat)
		G.ellipsoid(arm,Vector3(0,-0.42,-0.045),Vector3(0.132,0.27,0.14),coat if not infected else skin)
		G.ellipsoid(arm,Vector3(0,-0.56,-0.084),Vector3(0.126,0.17,0.115),skin)

func joint(at: Vector3) -> Node3D:
	var piece := Node3D.new()
	piece.position = at
	figure.add_child(piece)
	limbs.append(piece)
	return piece

func walk(delta: float, direction: Vector3, pace: float) -> void:
	var target := direction * pace
	if stagger > 0:
		stagger = maxf(0, stagger-delta)
		target = knockback
		knockback = knockback.move_toward(Vector3.ZERO,delta*12)
	velocity = velocity.lerp(target, minf(1,delta*11))
	move_and_slide()
	if direction.length_squared() > 0.01:
		var heading := atan2(-direction.x,-direction.z)
		rotation.y = lerp_angle(rotation.y,heading,minf(1,delta*12))
	stride += delta * (3.2 + velocity.length()*1.95)
	var swing := sin(stride)*clampf(velocity.length()/3.5,0.0,1.0)*0.61
	limbs[0].rotation.x = swing
	limbs[2].rotation.x = -swing
	var reach := -0.58 if infected and direction.length_squared() > 0.01 else 0.0
	limbs[1].rotation.x = reach - swing*0.62
	limbs[3].rotation.x = reach + swing*0.62
	figure.position.y = maxf(0,sin(stride*2))*absf(swing)*0.077
	figure.rotation.z = sin(stride)*0.035 if infected else 0.0
	attack_timer = maxf(0.0,attack_timer-delta)
