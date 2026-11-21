extends Node3D

const G = preload("res://scripts/geometry.gd")
const PUMP := Vector3(11.8, 0, -82)
const KIOSK := Vector3(18.2, 0, -91)
const CANISTER := Vector3(9.4, 0, -76)
const EXIT_Z := -237.0

var shortcut: Node3D
var canister_prop: Node3D
var brick_pattern: ImageTexture
var rng := RandomNumberGenerator.new()
var asphalt: StandardMaterial3D
var concrete: StandardMaterial3D
var paint: StandardMaterial3D
var steel: StandardMaterial3D
var glass: StandardMaterial3D
var lit: StandardMaterial3D
var amber: StandardMaterial3D
var dark: StandardMaterial3D

func _ready() -> void:
	rng.seed = 49218
	asphalt = grain(Color("#30383a"), 0.42)
	concrete = grain(Color("#666762"), 0.74)
	paint = G.material(Color("#c7c6ab"))
	steel = G.material(Color("#475357"), 0.55, 0.35)
	glass = G.material(Color("#2c444d"), 0.27, 0.25)
	lit = G.material(Color("#abbcbc"), 0.45, 0.0, 0.52)
	amber = G.material(Color("#ffc37e"), 0.45, 0.0, 1.1)
	dark = G.material(Color("#1a2225"))
	create_brick_pattern()
	sky()
	roads()
	forecourt()
	district()

func grain(tint: Color, roughness: float) -> StandardMaterial3D:
	var material := G.material(tint, roughness)
	var noise := FastNoiseLite.new()
	noise.frequency = 0.105
	var texture := NoiseTexture2D.new()
	texture.width = 256
	texture.height = 256
	texture.seamless = true
	texture.noise = noise
	var tones := Gradient.new()
	tones.colors = PackedColorArray([Color("#777d7d"), Color("#e0e0db")])
	texture.color_ramp = tones
	material.albedo_texture = texture
	material.uv1_triplanar = true
	material.uv1_world_triplanar = true
	material.uv1_scale = Vector3.ONE * 0.24
	return material

func sky() -> void:
	var world := WorldEnvironment.new()
	var scene_env := Environment.new()
	scene_env.background_mode = Environment.BG_COLOR
	scene_env.background_color = Color("#697d83")
	scene_env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	scene_env.ambient_light_color = Color("#afc2c9")
	scene_env.ambient_light_energy = 0.69
	scene_env.fog_enabled = true
	scene_env.fog_light_color = Color("#7e9296")
	scene_env.fog_density = 0.013
	world.environment = scene_env
	add_child(world)
	var light := DirectionalLight3D.new()
	light.rotation_degrees = Vector3(-34, -31, 0)
	light.light_color = Color("#d8e1da")
	light.light_energy = 0.63
	light.shadow_enabled = true
	light.directional_shadow_max_distance = 78.0
	add_child(light)

func roads() -> void:
	G.box(self, Vector3(12,-0.43,-114), Vector3(175,0.7,320), asphalt, true)
	for z in range(25,-241,-6):
		G.box(self, Vector3(0,0.008,z), Vector3(0.10,0.025,2.55), paint)
	for side in [-1, 1]:
		G.box(self, Vector3(side * 7.7,0.017,-117), Vector3(0.11,0.02,265), G.material(Color("#968354")))
	G.box(self, Vector3(-9.6,0.025,-116), Vector3(3.7,0.21,264), concrete)
	G.box(self, Vector3(9.6,0.025,-23), Vector3(3.2,0.21,89), concrete)
	G.box(self, Vector3(9.6,0.025,-176), Vector3(3.1,0.21,66), concrete)
	var puddle := G.material(Color("#4f6064"), 0.16, 0.55)
	for i in range(125):
		var x := rng.randf_range(-7.1, 7.1)
		var z := rng.randf_range(-247, 24)
		G.ellipsoid(self, Vector3(x,-0.038,z), Vector3(rng.randf_range(0.4,2.5),0.102,rng.randf_range(0.8,3.3)), puddle)
	for i in range(10):
		G.box(self, Vector3(-6.1 + i * 1.34,0.026,-69), Vector3(0.57,0.02,2.7), paint)
	# A long median building separates the escape routes beyond the station.
	for z in [-118, -146, -174]:
		terrace(Vector3(13.4,0,z), true, 20.0)
	for z in [-120, -149, -177]:
		G.box(self, Vector3(32,0.9,z), Vector3(0.65,1.8,23), concrete, true)
	for z in [-114, -122, -136, -144, -157, -166, -176, -185]:
		G.box(self, Vector3(29.8,0.009,z), Vector3(0.14,0.03,3.5), paint)
	G.box(self, Vector3(19,0.8,-201), Vector3(25,1.6,0.6), concrete, true)
	shortcut = Node3D.new()
	shortcut.position = Vector3(13.4,0,-160)
	shortcut.rotation.y = PI / 2
	G.box(self, Vector3(13.4,0.9,-132), Vector3(6.5,1.8,8.0), concrete, true)
	add_child(shortcut)
	G.box(shortcut, Vector3(0,0.74,0), Vector3(6.8,1.48,0.34), steel, true)
	G.label(shortcut, Vector3(0,1.0,0.21), "DEPOT BARRIER", 0.25, Color("#efcea1"))
	# The service road can always return to the main road south of the median.
	gantry(Vector3(0,0,-233), 15.0, "M25  /  EVACUATION CHECKPOINT")
	for x in [-9.4, 9.4]:
		G.box(self, Vector3(x,0.92,-244), Vector3(2.8,1.85,20), concrete, true)
	G.box(self, Vector3(0,0.9,-254), Vector3(23,1.8,0.8), concrete, true)
	G.box(self, Vector3(0,1.05,29), Vector3(39,2.1,0.6), concrete, true)
	for z in range(-242,29,12):
		for side in [-1,1]:
			G.box(self, Vector3(-21 if side < 0 else 40,1.55,z), Vector3(0.6,3.1,12.2), concrete, true)

func district() -> void:
	for z in range(15,-225,-9):
		terrace(Vector3(-14.4,0,z), false, 8.6)
	for z in range(15,-67,-9):
		terrace(Vector3(14.6,0,z), true, 8.6)
	for z in range(19,-240,-21):
		street_light(Vector3(-8.1,0,z), 1)
		if z > -60 or z < -205:
			street_light(Vector3(8.3,0,z-8), -1)
	for p in [Vector3(-5.1,0,-21), Vector3(4.6,0,-43), Vector3(-5.0,0,-105),
		Vector3(3.6,0,-133), Vector3(-3.1,0,-156), Vector3(5.0,0,-177), Vector3(-5.3,0,-207)]:
		wreck(p, rng.randf_range(-0.30,0.34))
	# Original double-decker silhouette marks the blocked forecourt junction.
	var bus := Node3D.new()
	bus.position = Vector3(-3.8,0,-68)
	bus.rotation.y = 0.22
	add_child(bus)
	var red := G.material(Color("#813e36"))
	G.box(bus, Vector3(0,2.10,0), Vector3(2.45,3.38,10), red, true)
	for x in [-1.24, 1.24]:
		for z in range(-4,5):
			for y in [1.62,3.16]:
				G.box(bus, Vector3(x,y,z), Vector3(0.025,0.79,0.88), glass)
	G.box(bus, Vector3(0,2.04,5.02), Vector3(2.12,0.75,0.03), glass)
	G.label(bus, Vector3(0,3.38,5.06), "N38   CLAPTON", 0.26, Color("#f0bd71"))
	for x in [-1.16,1.16]:
		for z in [-3.05,3.25]:
			var wheel := G.tube(bus,Vector3(x,0.47,z),0.49,0.28,dark)
			wheel.rotation.z = PI / 2
	gantry(Vector3(0,0,-49), 14.0, "A12   ·   MOTORWAY SERVICES")
	for i in range(18):
		var x := rng.randf_range(45.0,75.0) if i % 2 == 0 else rng.randf_range(-67.0,-28.0)
		var height := rng.randf_range(8.0,30.0)
		G.box(self,Vector3(x, height/2, rng.randf_range(-248,25)), Vector3(9,height,11), steel)

func terrace(at: Vector3, right: bool, extent: float) -> void:
	var building := Node3D.new()
	building.position = at
	building.rotation.y = -PI/2 if right else PI/2
	add_child(building)
	var brick := G.material([Color("#694b43"),Color("#79574a"),Color("#575458"),Color("#645050")][rng.randi_range(0,3)])
	brick.albedo_texture = brick_pattern
	brick.uv1_triplanar = true
	brick.uv1_world_triplanar = true
	brick.uv1_scale = Vector3.ONE * 0.47
	var floors := rng.randi_range(2, 4)
	var h := 1.4 + floors * 2.1
	G.box(building, Vector3(0,h/2,0), Vector3(extent,h,7), brick, true)
	G.box(building, Vector3(0,0.47,3.52), Vector3(extent,0.94,0.12), concrete)
	G.box(building, Vector3(0,h,0), Vector3(extent+0.35,0.34,7.36), dark)
	var ridge := G.box(building, Vector3(0,h+0.52,-0.18), Vector3(extent,0.68,5.5), dark)
	ridge.rotation.x = -0.07
	G.box(building, Vector3(extent * 0.27,h+1.1,-1.6), Vector3(0.65,1.75,0.75), brick)
	for floor_index in range(floors):
		var y := 1.43+floor_index * 2.1
		G.box(building, Vector3(0,y-0.68,3.54), Vector3(extent,0.10,0.14), concrete)
		for col in range(1,int(extent / 1.65)):
			var x := -extent / 2 + col * 1.72
			G.box(building, Vector3(x,y,3.515), Vector3(0.98,1.47,0.04), dark)
			var window := lit if rng.randf() < 0.08 else glass
			G.box(building, Vector3(x,y,3.543), Vector3(0.78,1.28,0.026), window)
			G.box(building, Vector3(x,y-0.69,3.61), Vector3(1.11,0.10,0.19), concrete)
			G.box(building, Vector3(x,y+0.08,3.567), Vector3(0.80,0.055,0.028), steel)
	G.box(building, Vector3(-extent * 0.34,1.08,3.58), Vector3(0.98,2.13,0.15), dark)

func forecourt() -> void:
	var tile := grain(Color("#64665e"), 0.6)
	G.box(self, Vector3(18,0.006,-84), Vector3(26,0.045,25), tile)
	var blue := G.material(Color("#25928c"),0.57,0.15)
	var yellow := G.material(Color("#e6b064"),0.55,0.0,0.3)
	G.box(self, Vector3(14.7,4.63,-81.4), Vector3(19,0.65,11.2), blue)
	G.box(self, Vector3(14.7,4.24,-81.4), Vector3(18.8,0.14,11), steel)
	G.label(self, Vector3(14.7,4.64,-75.75), "MERIDIAN  /  FUEL", 0.68, Color("#e4f5db"))
	for x in [14.3,23.8]:
		for z in [-77.0,-86.2]:
			G.box(self,Vector3(x,2.15,z),Vector3(0.29,4.3,0.29), steel, true)
	for x in [10.8,18.5]:
		G.box(self, Vector3(x,4.135,-81.5), Vector3(2.8,0.08,0.19), lit)
		area_light(Vector3(x,3.85,-81.3), Color("#b1fff0"), 8.1, 1.4)
	for p in [PUMP, Vector3(17.2,0,-82)]:
		G.box(self,p+Vector3(0,0.12,0),Vector3(1.52,0.24,2.7),concrete)
		G.box(self,p+Vector3(0,0.78,0),Vector3(0.74,1.53,0.55),blue,true)
		G.box(self,p+Vector3(-0.37,1.15,0),Vector3(0.041,0.29,0.38),lit)
		G.tube(self,p+Vector3(0.64,0.42,0.82),0.074,0.82,yellow)
		G.tube(self,p+Vector3(0.64,0.42,-0.82),0.074,0.82,yellow)
	G.box(self, KIOSK+Vector3(2.0,1.55,-2.15), Vector3(8.2,3.1,3.7), steel, true)
	G.box(self, KIOSK+Vector3(2.0,3.0,-2.14), Vector3(8.65,0.34,4.0), blue)
	for strip in range(19):
		G.box(self, KIOSK+Vector3(0,0.13*strip+0.2,-0.27), Vector3(2.9,0.084,0.09), concrete)
	G.box(self, KIOSK+Vector3(2.98,1.55,-0.27), Vector3(2.25,1.07,0.048), glass)
	G.label(self, KIOSK+Vector3(1.60,2.76,-0.20), "SERVICE  /  CALL POINT", 0.27, Color("#f5d5aa"))
	area_light(KIOSK+Vector3(0,2.65,0.5),Color("#ffad59"), 6.0, 1.2)
	canister_prop = Node3D.new()
	add_child(canister_prop)
	G.box(canister_prop, CANISTER+Vector3(0,0.23,0),Vector3(0.25,0.46,0.36),yellow)
	G.box(canister_prop, CANISTER+Vector3(0,0.48,0),Vector3(0.13,0.08,0.18),dark)
	G.label(self, Vector3(25.7,1.30,-100.5), "SERVICE LANE  →", 0.31, Color("#f5d5aa"))
	G.box(self, Vector3(25.7,1.3,-100.62),Vector3(4.1,0.65,0.18),steel)
	area_light(Vector3(5.6,4,-68), Color("#ff9e51"),8,1.0)

func wreck(at: Vector3, yaw: float) -> void:
	var object := Node3D.new()
	object.position = at
	object.rotation.y = yaw
	add_child(object)
	var coat := G.material([Color("#625749"),Color("#515f68"),Color("#6b6960")][rng.randi_range(0,2)], 0.49, 0.3)
	G.box(object,Vector3(0,0.64,0),Vector3(1.85,0.75,4.08),coat,true)
	G.box(object,Vector3(0,1.18,0.13),Vector3(1.48,0.62,1.88),glass)
	G.box(object,Vector3(0,1.50,0.15),Vector3(1.53,0.1,1.82),coat)
	for x in [-0.87,0.87]:
		for z in [-1.27,1.27]:
			var wheel := G.tube(object,Vector3(x,0.36,z),0.35,0.24,dark)
			wheel.rotation.z = PI/2

func gantry(at: Vector3, span: float, caption: String) -> void:
	G.box(self, at+Vector3(0,5,0),Vector3(span,0.3,0.32),steel)
	for x in [-span/2,span/2]:
		G.box(self,at+Vector3(x,2.52,0),Vector3(0.25,5.04,0.25),steel,true)
	G.box(self,at+Vector3(0,4.6,0.23),Vector3(span*0.55,1.22,0.13),G.material(Color("#275660")))
	G.label(self,at+Vector3(0,4.6,0.31),caption,0.36,Color("#e8f3de"))

func street_light(at: Vector3, side: float) -> void:
	G.tube(self,at+Vector3(0,3.0,0),0.067,6.0,steel,0.043)
	G.box(self,at+Vector3(side*0.67,5.99,0),Vector3(1.42,0.09,0.12),steel)
	G.box(self,at+Vector3(side*1.34,5.91,0),Vector3(0.34,0.09,0.28),amber)
	area_light(at+Vector3(side*1.34,5.76,0),Color("#ffc48b"),10,0.75)

func area_light(at: Vector3, tint: Color, reach: float, power: float) -> void:
	var light := OmniLight3D.new()
	light.position = at
	light.light_color = tint
	light.omni_range = reach
	light.light_energy = power
	add_child(light)

func set_shortcut_open(open: bool) -> void:
	shortcut.visible = not open
	var panel := shortcut.get_child(0)
	var wall_body := panel.get_child(0) as StaticBody3D
	wall_body.set_deferred("collision_layer",0 if open else 1)

func create_brick_pattern() -> void:
	var pattern := Image.create_empty(256,256,false,Image.FORMAT_RGB8)
	var texture_rng := RandomNumberGenerator.new()
	texture_rng.seed = 40773
	var colors: Array[float] = []
	for brick_index in range(80):
		colors.append(texture_rng.randf_range(0.77,1.0))
	for y in range(256):
		var course := y / 16
		for x in range(256):
			var staggered_x := (x+(32 if course % 2 == 1 else 0)) % 256
			var stone := colors[course*5+staggered_x/64]
			var seam := staggered_x % 64
			var line := y % 16
			var luminance := stone if line > 1 and seam > 1 else 0.48
			if line == 2 or seam == 2:
				luminance *= 0.67
			var shade := luminance * texture_rng.randf_range(0.92,1.04)
			pattern.set_pixel(x,y,Color(shade,shade,shade))
	pattern.generate_mipmaps()
	brick_pattern = ImageTexture.create_from_image(pattern)
