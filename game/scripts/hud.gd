extends Control

const INK := Color("#edf2e9")
const SUB := Color("#adbfbc")
const TEAL := Color("#7cdacb")
const AMBER := Color("#ffbf7f")
const PANEL := Color("#142026e8")
const LONDON = preload("res://scripts/london.gd")

var state: Dictionary = {}
var title := Label.new()
var body := Label.new()
var subtitle := Label.new()
var shell := PanelContainer.new()
var options: VBoxContainer
var default_button: Button
var last_overlay := ""

signal requested(action: String)

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	shell.set_anchors_and_offsets_preset(Control.PRESET_CENTER_LEFT)
	shell.offset_left = 48
	shell.offset_top = -218
	shell.offset_right = 566
	shell.offset_bottom = 214
	var surface := StyleBoxFlat.new()
	surface.bg_color = Color("#10191ef2")
	surface.border_color = Color("#426064")
	surface.border_width_left = 4
	surface.content_margin_left = 30
	surface.content_margin_top = 26
	surface.content_margin_right = 30
	surface.content_margin_bottom = 26
	shell.add_theme_stylebox_override("panel",surface)
	add_child(shell)
	options = VBoxContainer.new()
	options.add_theme_constant_override("separation",10)
	shell.add_child(options)
	subtitle.add_theme_font_size_override("font_size",15)
	subtitle.modulate = TEAL
	options.add_child(subtitle)
	title.add_theme_font_size_override("font_size",52)
	title.modulate = INK
	options.add_child(title)
	body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	body.add_theme_font_size_override("font_size",16)
	body.modulate = SUB
	body.custom_minimum_size = Vector2(440,75)
	options.add_child(body)
	shell.hide()

func set_overlay(mode: String, resumable: bool, detail := "") -> void:
	if mode == last_overlay:
		return
	last_overlay = mode
	shell.visible = not mode.is_empty()
	for child in options.get_children().slice(3):
		options.remove_child(child)
		child.queue_free()
	default_button = null
	match mode:
		"title":
			subtitle.text = "ROAD OF THE DEAD  /  LONDON, UK"
			title.text = "OUT OF LONDON"
			body.text = "The motorway checkpoint is still taking survivors. Park at Meridian, get enough fuel to reach the barrier, and bring the sedan back in one piece."
			if resumable:
				button("Continue from checkpoint", "retry")
			button("Start new run", "new")
			button("Quit to desktop", "quit")
		"pause":
			subtitle.text = "ROAD OF THE DEAD  /  OUT OF LONDON"
			title.text = "RUN PAUSED"
			body.text = "WASD drive or move · Space brake · E enter or exit\nHold E to interact · Shift sprint · F shove · M mute\nController: left stick, triggers, A interact, X shove"
			button("Resume run","resume")
			button("Retry checkpoint","retry")
			button("Return to title","title")
		"failed":
			subtitle.text = "OUT OF LONDON  /  RUN ENDED"
			title.text = "SIGNAL LOST"
			body.text = detail
			button("Retry checkpoint","retry")
			button("Return to title","title")
		"complete":
			subtitle.text = "ROAD OF THE DEAD  /  MISSION DEBRIEF"
			title.text = "CHECKPOINT CLEAR"
			title.add_theme_font_size_override("font_size",43)
			body.text = detail
			button("Replay mission","new")
			button("Return to title","title")
	if mode != "complete":
		title.add_theme_font_size_override("font_size",52)
	if default_button:
		default_button.grab_focus()
	queue_redraw()

func button(caption: String, action: String) -> void:
	var item := Button.new()
	item.text = caption
	item.alignment = HORIZONTAL_ALIGNMENT_LEFT
	item.custom_minimum_size.y = 39
	item.add_theme_color_override("font_color",INK)
	item.add_theme_color_override("font_hover_color",TEAL)
	item.add_theme_color_override("font_focus_color",TEAL)
	item.pressed.connect(func(): requested.emit(action))
	options.add_child(item)
	if default_button == null:
		default_button = item

func _draw() -> void:
	if state.is_empty():
		return
	if shell.visible:
		draw_rect(Rect2(Vector2.ZERO,size),Color("#0a141880"))
		return
	var font := ThemeDB.fallback_font
	var inset := 24.0
	var objective: String = state.objective
	draw_rect(Rect2(inset,inset,468,74),PANEL)
	draw_rect(Rect2(inset,inset,3,74),TEAL)
	draw_string(font,Vector2(inset+15,inset+23),"OUT OF LONDON  /  " + state.location,-1,-1,13,TEAL)
	draw_string(font,Vector2(inset+15,inset+53),objective,-1,433,20,INK)
	if not state.radio.is_empty():
		draw_rect(Rect2(inset,inset+83,496,38),PANEL)
		draw_string(font,Vector2(inset+13,inset+108),state.radio,-1,470,15,AMBER)
	var y := size.y-132
	draw_rect(Rect2(inset,y,280,108),PANEL)
	draw_string(font,Vector2(inset+12,y+26),"%03d" % state.speed,-1,-1,25,INK)
	draw_string(font,Vector2(inset+70,y+25),"KM/H", -1,-1,11,SUB)
	draw_string(font,Vector2(inset+157,y+24),state.mode,-1,-1,13,TEAL)
	gauge(font,Vector2(inset+12,y+49),"FUEL",state.fuel/25.0,AMBER)
	gauge(font,Vector2(inset+12,y+71),"BODY",state.hull/100.0,TEAL)
	gauge(font,Vector2(inset+12,y+92),"GRIP",state.wheel/100.0,TEAL)
	if state.mode == "ON FOOT":
		gauge(font,Vector2(inset+13,y-12),"HEALTH",state.health/100.0,TEAL)
	draw_map(font)
	if not state.prompt.is_empty():
		var width := minf(550.0,size.x-48)
		var x := (size.x-width)/2
		var py := size.y-100
		draw_rect(Rect2(x,py,width,49),PANEL)
		draw_string(font,Vector2(x+17,py+30),state.prompt,-1,width-34,17,INK)
		if state.progress > 0.0:
			draw_rect(Rect2(x,py+45,width*state.progress,4),TEAL)
	if state.damage > 0:
		draw_rect(Rect2(Vector2.ZERO,size),Color(0.63,0.19,0.09,state.damage*0.14))
	if state.warning != Vector2.ZERO:
		var at := Vector2(size.x/2,48)
		var direction: Vector2 = state.warning
		var dx := clampf(direction.x * 240,-260,260)
		draw_string(font,at+Vector2(dx-49,9),"◆  SCREAMER",-1,-1,15,AMBER)

func gauge(font: Font, at: Vector2, caption: String, amount: float, tint: Color) -> void:
	draw_string(font,at,caption,-1,-1,11,SUB)
	draw_rect(Rect2(at+Vector2(58,-8),Vector2(191,5)),Color("#425252"))
	var color := Color("#e17c62") if amount < 0.21 else tint
	draw_rect(Rect2(at+Vector2(58,-8),Vector2(clampf(amount,0,1)*191,5)),color)

func draw_map(font: Font) -> void:
	var origin := Vector2(size.x-184,24)
	draw_rect(Rect2(origin,Vector2(160,188)),PANEL)
	draw_string(font,origin+Vector2(12,20),"EVACUATION ROUTE",-1,-1,11,TEAL)
	var top := origin + Vector2(61,43)
	var bottom := origin + Vector2(61,166)
	draw_line(top,bottom,Color("#708380"),4,true)
	var branch := PackedVector2Array([origin+Vector2(61,93),origin+Vector2(117,93),
		origin+Vector2(117,142),origin+Vector2(61,145)])
	draw_polyline(branch,Color("#708380"),3,true)
	draw_circle(origin+Vector2(61,93),5,AMBER)
	draw_circle(bottom,5,TEAL)
	draw_string(font,origin+Vector2(10,47),"START",-1,-1,9,SUB)
	draw_string(font,origin+Vector2(11,96),"FUEL",-1,-1,9,SUB)
	draw_string(font,origin+Vector2(15,169),"M25",-1,-1,9,SUB)
	var point: Vector3 = state.pos
	var y := remap(clampf(point.z,LONDON.EXIT_Z,16),16,LONDON.EXIT_Z,43,166)
	var tracking_x := 61.0+clampf((point.x-3.5)*2.48,0,56)
	draw_circle(origin+Vector2(tracking_x,y),4,INK)
