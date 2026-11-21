extends Node3D

const G = preload("res://scripts/geometry.gd")
const Map = preload("res://scripts/london.gd")
const Sedan = preload("res://scripts/sedan.gd")
const Person = preload("res://scripts/person.gd")
const Checkpoint = preload("res://scripts/checkpoint.gd")
const Hud = preload("res://scripts/hud.gd")
const Sound = preload("res://scripts/sound.gd")
const START := Vector3(2.7,0,16.0)
const ARRIVAL := Vector3(3.5,0,-73.0)

var london: Map
var car: Sedan
var alex: Person
var hud: Hud
var sound: Sound
var camera: Camera3D
var rain: CPUParticles3D
var marker: Node3D
var marker_material: StandardMaterial3D
var enemies: Array[Person] = []
var checkpoint: Dictionary = {}
var overlay := "title"
var driving := true
var health := 100.0
var hit_recovery := 0.0
var damage_flash := 0.0
var reached_station := false
var fueled := 0.0
var rescued := false
var canister_used := false
var canister_carried := false
var route := ""
var first_call := -1.0
var called := false
var refueling := false
var interaction := ""
var interaction_elapsed := 0.0
var prompt := ""
var progress_bar := 0.0
var radio := ""
var radio_left := 0.0
var strafe_yaw := 0.0
var camera_yaw := 0.0
var camera_primed := false
var elapsed := 0.0
var shove_delay := 0.0
var step_delay := 0.0
var hits := 0
var last_checkpoint_write := OK

func _ready() -> void:
	configure_actions()
	london = Map.new()
	add_child(london)
	car = Sedan.new()
	add_child(car)
	alex = Person.new()
	add_child(alex)
	alex.hide()
	car.position = START
	alex.position = START
	camera = Camera3D.new()
	camera.fov = 66
	camera.far = 215
	add_child(camera)
	camera.current = true
	build_effects()
	sound = Sound.new()
	add_child(sound)
	var layer := CanvasLayer.new()
	add_child(layer)
	hud = Hud.new()
	layer.add_child(hud)
	hud.requested.connect(menu)
	if not has_arg("--validation"):
		checkpoint = Checkpoint.read()
	camera_update(1.0)
	update_hud(0.0)
	hud.set_overlay("title",not checkpoint.is_empty())

func configure_actions() -> void:
	bind("throttle_up",KEY_W,JOY_AXIS_TRIGGER_RIGHT,1)
	bind("throttle_down",KEY_S,JOY_AXIS_TRIGGER_LEFT,1)
	bind("leftward",KEY_A,JOY_AXIS_LEFT_X,-1)
	bind("rightward",KEY_D,JOY_AXIS_LEFT_X,1)
	bind("walk_up",KEY_W,JOY_AXIS_LEFT_Y,-1)
	bind("walk_down",KEY_S,JOY_AXIS_LEFT_Y,1)
	bind("brake",KEY_SPACE,-1,0,JOY_BUTTON_LEFT_SHOULDER)
	bind("sprint",KEY_SHIFT,-1,0,JOY_BUTTON_RIGHT_SHOULDER)
	bind("interact",KEY_E,-1,0,JOY_BUTTON_A)
	bind("shove",KEY_F,-1,0,JOY_BUTTON_X)
	bind("pause",KEY_ESCAPE,-1,0,JOY_BUTTON_START)
	bind("mute",KEY_M)
	bind("camera_left",KEY_NONE,JOY_AXIS_RIGHT_X,-1)
	bind("camera_right",KEY_NONE,JOY_AXIS_RIGHT_X,1)
	bind("key_forward",KEY_UP)
	bind("key_back",KEY_DOWN)

func bind(action: String, key: int, axis := -1, direction := 1, pad := -1) -> void:
	if InputMap.has_action(action):
		return
	InputMap.add_action(action,0.23)
	if key != KEY_NONE:
		var keyboard := InputEventKey.new()
		keyboard.physical_keycode = key
		InputMap.action_add_event(action,keyboard)
	if axis >= 0:
		var stick := InputEventJoypadMotion.new()
		stick.axis = axis
		stick.axis_value = direction
		stick.device = -1
		InputMap.action_add_event(action,stick)
	if pad >= 0:
		var button := InputEventJoypadButton.new()
		button.button_index = pad
		button.device = -1
		InputMap.action_add_event(action,button)

func build_effects() -> void:
	var rain_mat := G.material(Color("#9eacaa56"))
	rain_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	rain_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	var drop := BoxMesh.new()
	drop.size = Vector3(0.012,0.49,0.012)
	drop.material = rain_mat
	rain = CPUParticles3D.new()
	rain.mesh = drop
	rain.amount = 350
	rain.lifetime = 0.63
	rain.preprocess = 0.7
	rain.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
	rain.emission_box_extents = Vector3(13,0.4,15)
	rain.direction = Vector3(0.15,-1,0.06)
	rain.spread = 5
	rain.gravity = Vector3(0,-16,0)
	rain.initial_velocity_min = 14
	rain.initial_velocity_max = 20
	add_child(rain)
	marker = Node3D.new()
	add_child(marker)
	marker_material = G.material(Color("#60f5dd"),0.4,0,1.0)
	var ring := TorusMesh.new()
	ring.inner_radius = 0.94
	ring.outer_radius = 1.07
	ring.rings = 28
	ring.ring_segments = 9
	G.mesh(marker,ring,Vector3.ZERO,marker_material)
	var diamond := G.box(marker,Vector3(0,2.52,0),Vector3(0.24,0.24,0.24),marker_material)
	diamond.rotation.z = PI / 4
	marker.hide()

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause") and not event.is_echo():
		if overlay == "":
			menu("pause")
		elif overlay == "pause":
			menu("resume")
	if event is InputEventMouseMotion and overlay.is_empty() and Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT):
		strafe_yaw = wrapf(strafe_yaw-event.relative.x*0.006,-PI,PI)
	if event.is_action_pressed("mute") and not event.is_echo():
		sound.muted = not sound.muted

func menu(action: String) -> void:
	match action:
		"new":
			restore(start_snapshot())
			save_checkpoint("safehouse",START)
			announce("RADIO  ·  Meridian is still on backup power.",5.0)
		"retry":
			if not checkpoint.is_empty():
				restore(checkpoint)
				announce("CHECKPOINT RESTORED",3.0)
		"title":
			show_overlay("title")
		"pause":
			close_interaction()
			show_overlay("pause")
		"resume":
			show_overlay("")
		"quit":
			get_tree().quit()

func show_overlay(mode: String, detail := "") -> void:
	overlay = mode
	hud.set_overlay(mode,not checkpoint.is_empty(),detail)

func start_snapshot() -> Dictionary:
	return {"version":1,"id":"safehouse","position":START,"yaw":0.0,"fuel":4.4,"hull":100.0,"wheel":100.0,"rescued":false}

func save_checkpoint(id: String, spot: Vector3) -> void:
	checkpoint = {"version":1,"id":id,"position":spot,"yaw":0.0,"fuel":car.fuel,"hull":car.hull,"wheel":car.wheel_condition,"rescued":rescued}
	persist_checkpoint()

func persist_checkpoint() -> void:
	if not has_arg("--validation"):
		last_checkpoint_write = Checkpoint.write(checkpoint)
		if last_checkpoint_write != OK:
			announce("CHECKPOINT AVAILABLE UNTIL YOU QUIT",5.0)

func restore(data: Dictionary) -> void:
	for enemy in enemies:
		remove_child(enemy)
		enemy.queue_free()
	enemies.clear()
	car.position = data.position
	car.rotation = Vector3(0,data.yaw,0)
	car.fuel = data.fuel
	car.hull = data.hull
	car.wheel_condition = data.wheel
	car.speed = 0.0
	car.velocity = Vector3.ZERO
	car.impact_cooldown = 0
	car.driver_enabled = true
	alex.position = data.position
	alex.velocity = Vector3.ZERO
	alex.hide()
	driving = true
	health = 100.0
	hit_recovery = 0.0
	damage_flash = 0.0
	fueled = 0.0
	rescued = data.get("rescued",false)
	london.set_shortcut_open(rescued)
	canister_used = false
	london.canister_prop.show()
	canister_carried = false
	refueling = false
	route = ""
	first_call = -1.0
	called = false
	close_interaction()
	elapsed = 0.0
	hits = 0
	shove_delay = 0.0
	step_delay = 0.0
	strafe_yaw = 0.0
	camera_primed = false
	reached_station = data.id == "forecourt"
	radio = ""
	radio_left = 0.0
	seed_encounter(reached_station)
	show_overlay("")
	update_hud(0.0)

func has_arg(flag: String) -> bool:
	return flag in OS.get_cmdline_user_args()

func _physics_process(delta: float) -> void:
	if overlay.is_empty():
		var steer := Input.get_axis("rightward","leftward")
		var throttle := Input.get_axis("throttle_down","throttle_up")
		if is_zero_approx(throttle):
			throttle = Input.get_axis("key_back","key_forward")
		var foot_input := Input.get_vector("leftward","rightward","walk_up","walk_down")
		if not is_zero_approx(foot_input.length_squared()):
			foot_input = foot_input.rotated(-camera_yaw)
		strafe_yaw += Input.get_axis("camera_right","camera_left") * delta*1.57
		tick_run(delta,throttle,steer,foot_input,Input.is_action_pressed("brake"),Input.is_action_pressed("sprint"),
			Input.is_action_just_pressed("interact"),Input.is_action_pressed("interact"),Input.is_action_just_pressed("shove"))
	camera_update(delta)
	update_hud(delta)
	sound.levels(absf(car.speed),driving and overlay.is_empty(),called and overlay.is_empty())

func tick_run(delta: float, throttle: float, steer: float, foot: Vector2, brake: bool, sprint: bool, pressed: bool, held: bool, pushing: bool) -> void:
	elapsed += delta
	radio_left = maxf(0.0,radio_left-delta)
	damage_flash = maxf(0.0,damage_flash-delta*2.0)
	hit_recovery = maxf(0.0,hit_recovery-delta)
	shove_delay = maxf(0.0,shove_delay-delta)
	if driving:
		car.drive(delta,throttle,steer,brake,car.position.x > 22.0 and car.position.z < -100)
		if car.impact > 0.0:
			damage_flash = 0.6
			sound.cue("impact")
	else:
		car.drive(delta,0.0,0.0,true,false)
		var pace := 6.6 if sprint else 4.25
		alex.walk(delta,Vector3(foot.x,0,foot.y),pace)
		step_delay -= delta
		if foot.length_squared() > 0.1 and step_delay <= 0.0:
			sound.cue("step")
			step_delay = 0.30 if sprint else 0.39
		if pushing and shove_delay <= 0.0:
			shove()
	if not reached_station and car.position.z < -72.0 and absf(car.position.x) < 20.0:
		reached_station = true
		announce("RADIO  ·  Pull up at the lit pumps on your right.",5.0)
		save_checkpoint("forecourt",ARRIVAL)
	handle_interaction(delta,pressed,held)
	update_encounter(delta)
	update_gate()

func handle_interaction(delta: float, pressed: bool, held: bool) -> void:
	prompt = ""
	progress_bar = 0.0
	if driving:
		if absf(car.speed) < 1.45:
			prompt = "[E / A]  Exit sedan"
			if pressed:
				switch_driver(false)
		elif pressed:
			prompt = "Brake before getting out"
		return
	var at := alex.position
	if at.distance_to(Map.PUMP) < 2.45 and car.position.distance_to(Map.PUMP) < 6.8:
		if car.fuel < Sedan.MAX_FUEL:
			prompt = "[Hold E / A]  Transfer fuel   •   %.1f / %.0f L" % [car.fuel, Sedan.MAX_FUEL]
			if held and hit_recovery < 0.68:
				refueling = true
				var amount := minf(delta*1.26,Sedan.MAX_FUEL-car.fuel)
				car.fuel += amount
				fueled += amount
				progress_bar = car.fuel/Sedan.MAX_FUEL
				return
		else:
			prompt = "Tank full"
	elif not rescued and at.distance_to(Map.KIOSK) < 2.4:
		prompt = "[Hold E / A]  Release trapped worker"
		if timed_interaction(delta,"rescue",held,2.1):
			rescued = true
			london.set_shortcut_open(true)
			checkpoint["rescued"] = true
			persist_checkpoint()
			announce("WORKER  ·  I’ve opened the depot cut-through!",5.0)
			close_interaction()
			return
	elif not canister_used and at.distance_to(Map.CANISTER) < 1.55:
		prompt = "[E / A]  Take emergency fuel"
		if pressed:
			canister_used = true
			london.canister_prop.hide()
			canister_carried = true
			announce("EMERGENCY FUEL  ·  Carry it back to the sedan.",4.0)
	elif at.distance_to(car.position) < 3.34:
		if canister_carried:
			prompt = "[Hold E / A]  Add emergency fuel"
			if timed_interaction(delta,"canister",held,1.25):
				car.fuel = minf(Sedan.MAX_FUEL,car.fuel+4.0)
				fueled = maxf(0.01,fueled)
				canister_carried = false
				close_interaction()
				announce("EMERGENCY FUEL ADDED",3.0)
				return
		else:
			prompt = "[E / A]  Enter sedan"
			if pressed:
				switch_driver(true)
	else:
		close_interaction()
	if refueling:
		refueling = false
	if not held:
		close_interaction()

func timed_interaction(delta: float, id: String, held: bool, duration: float) -> bool:
	if not held:
		close_interaction()
		return false
	if interaction != id:
		close_interaction()
		interaction = id
	interaction_elapsed += delta
	progress_bar = minf(1.0,interaction_elapsed/duration)
	return progress_bar >= 1.0

func close_interaction() -> void:
	interaction = ""
	interaction_elapsed = 0.0
	refueling = false

func switch_driver(enter: bool) -> void:
	var driver_side := car.position + car.basis.x*1.66
	var passenger_side := car.position - car.basis.x*1.66
	var doors := [driver_side,passenger_side]
	if enter and driver_side.distance_squared_to(alex.position) > passenger_side.distance_squared_to(alex.position):
		doors.reverse()
	var door := Vector3.INF
	for point in doors:
		if door_clear(point) and (not enter or alex.position.distance_to(point) < 2.3):
			door = point
			break
	if not door.is_finite():
		prompt = "Door blocked   •   try the other side"
		return
	close_interaction()
	driving = enter
	car.driver_enabled = enter
	car.speed = 0.0
	car.velocity = Vector3.ZERO
	alex.position = door
	alex.rotation.y = car.rotation.y
	alex.velocity = Vector3.ZERO
	alex.visible = not enter
	strafe_yaw = 0.0
	if not enter:
		camera_yaw = alex.rotation.y
	prompt = ""

func door_clear(point: Vector3) -> bool:
	var shape := BoxShape3D.new()
	shape.size = Vector3(0.64,1.44,0.64)
	var params := PhysicsShapeQueryParameters3D.new()
	params.shape = shape
	params.transform = Transform3D(Basis.IDENTITY,point+Vector3(0,0.90,0))
	params.exclude = [car.get_rid(),alex.get_rid()]
	if not get_world_3d().direct_space_state.intersect_shape(params,1).is_empty():
		return false
	var origin := alex.position if not driving else car.position
	return ray(origin+Vector3.UP*0.65,point+Vector3.UP*0.65).is_empty()

func ray(from: Vector3, to: Vector3) -> Dictionary:
	var query := PhysicsRayQueryParameters3D.create(from,to,1,[car.get_rid(),alex.get_rid()])
	return get_world_3d().direct_space_state.intersect_ray(query)

func seed_encounter(at_station: bool) -> void:
	if not at_station:
		for p in [Vector3(1.8,0,-25),Vector3(-4.1,0,-44),Vector3(6.1,0,-56)]:
			spawn(p,false)
	for p in [Vector3(26.2,0,-92),Vector3(23.7,0,-98),Vector3(5.0,0,-101),Vector3(-4.6,0,-84),
		Vector3(-2.1,0,-116),Vector3(-1.4,0,-129),Vector3(1.6,0,-135),Vector3(0,0,-143),
		Vector3(2.9,0,-157),Vector3(1.7,0,-166),Vector3(-2.8,0,-184),Vector3(26.5,0,-149)]:
		spawn(p,false)
	spawn(Vector3(23.6,0,-88),true)

func spawn(at: Vector3, alarm: bool) -> void:
	var enemy := Person.new()
	enemy.position = at
	enemy.infected = true
	enemy.screamer = alarm
	add_child(enemy)
	enemies.append(enemy)

func update_encounter(delta: float) -> void:
	var target := car.position if driving else alex.position
	var siren: Person = null
	for i in range(enemies.size()-1,-1,-1):
		var enemy := enemies[i]
		var offset := target-enemy.position
		var range_to := offset.length()
		if range_to > 56:
			continue
		if driving and range_to < 2.4 and absf(car.speed) > 5.9:
			var rel := car.to_local(enemy.position)
			if absf(rel.x) < 1.33:
				hits += 1
				car.hull = maxf(0.0,car.hull-2.3)
				car.wheel_condition = maxf(0.0,car.wheel_condition-1.5)
				car.speed *= 0.86
				car.velocity *= 0.79
				enemy.queue_free()
				enemies.remove_at(i)
				sound.cue("impact")
				damage_flash = 0.34
				continue
		if enemy.screamer:
			siren = enemy
		var aggro := range_to < (32.0 if called else (17.0 if not driving else 11.0 + absf(car.speed)*0.45))
		var heading := offset.normalized() if aggro else Vector3.ZERO
		if aggro and range_to > 1.3:
			heading = pursuit_heading(enemy,heading)
		enemy.walk(delta,heading,2.35 if not driving and called else 1.87)
		var reach := 2.2 if driving else 0.91
		if range_to < reach and enemy.attack_timer <= 0 and enemy.stagger <= 0:
			enemy.attack_timer = 1.32
			if driving:
				car.hull = maxf(0.0,car.hull-3.0)
			elif hit_recovery <= 0.0:
				health = maxf(0.0,health-9.0)
				hit_recovery = 0.85
				refueling = false
			else:
				continue
			damage_flash = 0.75
			sound.cue("impact")
	if not called and is_instance_valid(siren) and reached_station:
		if first_call < 0 and (refueling or (not driving and target.distance_to(siren.position) < 12.0)):
			first_call = 4.3
			announce("RADIO  ·  That one is calling the others. Move!",4.3)
			sound.cue("scream")
		if first_call > 0:
			first_call = maxf(0.001,first_call-delta)
		if first_call <= 0.01 and first_call > 0:
			called = true
			for p in [Vector3(6.2,0,-111),Vector3(28.7,0,-119),Vector3(29.7,0,-115),Vector3(-7.1,0,-97),Vector3(-6.8,0,-104),Vector3(2.7,0,-113)]:
				if target.distance_to(p) > 13.0 and not ray(target+Vector3.UP*1.5,p+Vector3.UP*1.1).is_empty():
					spawn(p,false)
	if not is_instance_valid(siren) and not called:
		first_call = -1.0

func pursuit_heading(enemy: Person, desired: Vector3) -> Vector3:
	var origin := enemy.position+Vector3.UP*0.85
	if ray(origin,origin+desired*1.35).is_empty():
		return desired
	for side in [0.9,-0.9,1.55,-1.55]:
		var turn := desired.rotated(Vector3.UP,side)
		if ray(origin,origin+turn*1.75).is_empty():
			return turn
	return Vector3.ZERO

func shove() -> void:
	shove_delay = 0.62
	for enemy in enemies:
		var delta := enemy.position-alex.position
		if delta.length() < 1.70 and delta.normalized().dot(-alex.basis.z) > -0.17:
			enemy.stagger = 0.65
			enemy.knockback = delta.normalized()*6.1
	sound.cue("shove")

func update_gate() -> void:
	if car.position.z < -115 and car.position.z > -183:
		if route.is_empty():
			route = "Service lane" if car.position.x > 21 else "High street"
	if car.position.z < -154 and car.position.z > -166 and car.position.x > 11 and car.position.x < 17 and rescued:
		route = "Depot shortcut"
	if health <= 0:
		end_run("Alex was overwhelmed at the station.")
	elif car.hull <= 0:
		end_run("The sedan can no longer move. Retry with fewer impacts or take the service lane.")
	elif car.fuel <= 0 and absf(car.speed) < 0.45 and (car.position.distance_to(Map.CANISTER) > 13.0 or canister_used and not canister_carried):
		end_run("The tank is dry. Transfer more fuel before leaving Meridian.")
	elif driving and car.fuel > 0 and car.position.z < Map.EXIT_Z and absf(car.position.x) < 7.9:
		var path := route if not route.is_empty() else "High street"
		var seconds := int(elapsed)
		sound.cue("success")
		show_overlay("complete","%s  ·  %d:%02d elapsed\n%.1f L fuel  ·  %d%% body  ·  %d%% grip\n%s  ·  %d infected struck" %
			[path,seconds/60,seconds%60,car.fuel,int(car.hull),int(car.wheel_condition),"Worker rescued" if rescued else "Worker left behind",hits])

func end_run(reason: String) -> void:
	close_interaction()
	show_overlay("failed",reason)

func announce(line: String, seconds: float) -> void:
	radio = line
	radio_left = seconds
	sound.cue("radio")

func camera_update(delta: float) -> void:
	var target := car.position if driving else alex.position
	var yaw_target := car.rotation.y if driving else camera_yaw
	var camera_bias := 0.0
	var offset := Vector3(0.0,3.55,7.5) if driving else Vector3(0.99,1.96,3.8)
	var attention := target + Vector3(0,1.03,0)
	if overlay == "title":
		offset = Vector3(4.6,1.95,6.7)
		camera_bias = -0.16
	if driving:
		camera_yaw = lerp_angle(camera_yaw,yaw_target,minf(1,delta*(6.0 if absf(car.speed) > 1.0 else 3.2)))
	var yaw := camera_yaw+strafe_yaw+camera_bias
	var goal := target+offset.rotated(Vector3.UP,yaw)
	var obstruction := ray(attention,goal)
	if not obstruction.is_empty():
		goal = obstruction.position + obstruction.normal*0.20
	var weight := (1.0-exp(-delta*13.0)) if camera_primed else 1.0
	camera.position = camera.position.lerp(goal,weight)
	camera_primed = true
	var ahead := Vector3(0,0,-(4.6 if driving else 2.1)).rotated(Vector3.UP,yaw)
	camera.look_at(attention+ahead)
	rain.position = camera.position + Vector3(0,7.6,-7.0)
	camera.fov = lerpf(camera.fov, 63.0 + absf(car.speed)*0.36 if driving else 67.0, minf(1,delta*4.0))

func update_hud(delta: float) -> void:
	var focus := car.position if driving else alex.position
	var objective := "Drive to the Meridian station"
	var location := "CLAPTON"
	if reached_station:
		location = "MERIDIAN SERVICES" if focus.z > -110 else "MOTORWAY APPROACH"
		if fueled < 0.5 and driving:
			objective = "Park beside the marked pump"
		elif fueled < 0.5:
			objective = "Transfer fuel to the sedan"
		elif not driving:
			objective = "Return to the sedan when ready"
		else:
			objective = "Reach the motorway checkpoint"
	var marker_at := Map.PUMP
	if fueled > 0.5:
		marker_at = Vector3(car.position.x,0,car.position.z) if not driving else Vector3(0,0,Map.EXIT_Z)
	marker.position = marker_at+Vector3.UP*0.055
	marker.rotation.y += delta*0.75
	marker.visible = overlay.is_empty()
	marker_material.emission_energy_multiplier = 0.8 + sin(elapsed*3.2)*0.28
	var warning := Vector2.ZERO
	if first_call > 0 and not called:
		for enemy in enemies:
			if enemy.screamer:
				var side := camera.global_basis.x.dot((enemy.position-focus).normalized())
				warning = Vector2(side,1)
				break
	hud.state = {"objective":objective,"location":location,"radio":radio if radio_left > 0 else "",
		"speed":roundi(absf(car.speed)*3.6),"mode":"IN SEDAN" if driving else "ON FOOT","fuel":car.fuel,
		"hull":car.hull,"wheel":car.wheel_condition,"health":health,"pos":focus,"prompt":prompt,
		"progress":progress_bar,"damage":damage_flash,"warning":warning}
	hud.queue_redraw()
