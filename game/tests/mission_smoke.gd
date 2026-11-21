extends SceneTree

const Mission = preload("res://scripts/mission.gd")
const Map = preload("res://scripts/london.gd")
const Checkpoint = preload("res://scripts/checkpoint.gd")
const SCENE = preload("res://out_of_london.tscn")
const STEP := 1.0/60.0

var game: Mission
var errors: Array[String] = []

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	game = SCENE.instantiate()
	root.add_child(game)
	game.set_physics_process(false)
	await physics_frame
	check(game.overlay == "title","Title opens")
	game.menu("new")
	await drive([Vector2(0,-15),Vector2(0,-62),Vector2(7.2,-81.3)],false)
	await stop()
	check(game.reached_station and game.checkpoint.id == "forecourt","Driving triggers forecourt checkpoint")
	check(game.car.fuel < 4.4 and game.car.fuel > 0.2,"Driving drains fuel")
	if not await fuel_and_reenter(true):
		finish()
		return
	await drive([Vector2(7,-93),Vector2(1.1,-107),Vector2(0,-169),Vector2(1,-218),Vector2(0,-243)],true)
	check(game.overlay == "complete" and game.route == "High street","High street reaches mission debrief (%s, %s, %.0f body, %.1f L)" % [game.overlay,game.car.position,game.car.hull,game.car.fuel])
	var old_run := game.elapsed
	await tick(0)
	check(is_equal_approx(game.elapsed,old_run),"Completion locks the mission")
	game.menu("retry")
	await physics_frame
	check(game.car.position == Mission.ARRIVAL and game.driving and game.fueled == 0,"Retry restores coherent forecourt state")
	check(game.rescued and not game.london.shortcut.visible,"Rescue and shortcut survive checkpoint retry")
	await drive([Vector2(7.2,-81.3)],false)
	await stop()
	if not await fuel_and_reenter(false):
		finish()
		return
	await drive([Vector2(8.7,-96.0),Vector2(14,-102.0),Vector2(23.4,-102.4),Vector2(27,-110),
		Vector2(27,-172),Vector2(25.5,-186),Vector2(18,-193),Vector2(4,-193.5),
		Vector2(1.6,-202),Vector2(1.8,-240)],true)
	check(game.overlay == "complete" and game.route == "Service lane","Service lane reaches mission debrief (%s, %s, %s, %.0f body, %.1f L)" % [game.overlay,game.route,game.car.position,game.car.hull,game.car.fuel])
	game.menu("retry")
	game.car.fuel = 0
	game.car.position = Vector3(1,0,-179)
	await tick()
	check(game.overlay == "failed","Fuel exhaustion beyond recovery ends the run")
	game.menu("retry")
	check(game.car.fuel > 0.0 and game.overlay == "","Checkpoint restores playable state after failure")
	if "--validation" not in OS.get_cmdline_user_args():
		check(game.last_checkpoint_write == OK and Checkpoint.read() == game.checkpoint,"Checkpoint round-trips to disk")
		var app_data := ProjectSettings.globalize_path("user://")
		if app_data.begins_with("/tmp/zombieeu"):
			var previous := game.checkpoint.duplicate()
			var changed := previous.duplicate()
			changed.rescued = false
			check(Checkpoint.write(changed) == OK and Checkpoint.read() == changed,"Checkpoint replacement works")
			var invalid := FileAccess.open(Checkpoint.PRIMARY,FileAccess.WRITE)
			invalid.store_var({"version":-1})
			invalid.close()
			check(Checkpoint.read() == previous,"Invalid primary save falls back to complete backup")
	finish()

func fuel_and_reenter(rescue: bool) -> bool:
	var starting_fuel := game.car.fuel
	await tick(0,0,Vector2.ZERO,true,true,true)
	check(not game.driving,"Station has a workable exit door")
	await walk_to(Vector2(10.0,-82.0))
	for frame in range(110):
		await tick(0,0,Vector2.ZERO,true,false,true)
	var partial := game.car.fuel
	await tick()
	check(partial > starting_fuel+1.5 and not game.refueling and is_equal_approx(game.car.fuel,partial),"Interrupted transfer preserves only the transferred fuel")
	for frame in range(128):
		await tick(0,0,Vector2.ZERO,true,false,true,frame % 42 == 0)
	check(game.car.fuel > partial+1.8,"Fueling can resume")
	if rescue:
		await walk_to(Vector2(14.2,-86.5))
		await walk_to(Vector2(18.0,-89.3))
		for frame in range(135):
			await tick(0,0,Vector2.ZERO,true,false,true,frame % 43 == 0)
		check(game.rescued,"Worker interaction opens depot shortcut (%s, HP %.0f, %.2f seconds)" % [game.alex.position,game.health,game.interaction_elapsed])
		await walk_to(Vector2(13.2,-87.9))
		await walk_to(Vector2(9.0,-85.6))
	await walk_to(Vector2(game.car.position.x+1.66,game.car.position.z+0.55))
	await tick(0,0,Vector2.ZERO,true,true,true)
	check(game.driving,"Alex can return to the parked sedan")
	return game.driving

func drive(points: Array, finish_expected: bool) -> void:
	for i in range(points.size()):
		var point: Vector2 = points[i]
		var timeout := 0
		var tolerance := 1.9 if i < points.size()-1 or finish_expected else 0.80
		while game.overlay.is_empty() and planar(game.car.position).distance_to(point) > tolerance:
			timeout += 1
			if timeout > 680:
				check(false,"Drive can reach %s from %s, yaw %.2f, hull %.0f, fuel %.1f" %
					[point,planar(game.car.position),game.car.rotation.y,game.car.hull,game.car.fuel])
				return
			var offset := point-planar(game.car.position)
			var desired := atan2(-offset.x,-offset.y)
			var error := angle_difference(game.car.rotation.y,desired)
			var limit := 17.0 if offset.length() > 15 and absf(error) < 0.42 else 7.2
			if i == points.size()-1 and not finish_expected:
				limit = minf(limit,sqrt(maxf(offset.length()-0.55,0.05)*7.0))
			var steering := clampf(error*3.1,-1,1)
			var throttle := clampf((limit-game.car.speed)*0.47,0.0,1.0)
			await tick(throttle,steering,Vector2.ZERO,game.car.speed > limit+1.5)
		if not game.overlay.is_empty():
			return

func walk_to(point: Vector2) -> void:
	for frame in range(160):
		var offset := point-planar(game.alex.position)
		if offset.length() < 0.45:
			return
		await tick(0,0,offset.normalized(),true,false,false,frame % 43 == 0)
	check(false,"Walking can reach %s from %s" % [point,planar(game.alex.position)])

func stop() -> void:
	for frame in range(40):
		await tick(0,0,Vector2.ZERO,true)

func tick(throttle := 0.0, steering := 0.0, foot := Vector2.ZERO, brake := false, pressed := false, held := false, shove := false) -> void:
	await physics_frame
	if game.overlay.is_empty():
		game.tick_run(STEP,throttle,steering,foot,brake,true,pressed,held,shove)

func planar(at: Vector3) -> Vector2:
	return Vector2(at.x,at.z)

func check(ok: bool, description: String) -> void:
	if ok:
		print("PASS  ",description)
	else:
		errors.append(description)
		printerr("FAIL  ",description)

func finish() -> void:
	print("%d failing assertions" % errors.size())
	quit(0 if errors.is_empty() else 1)
