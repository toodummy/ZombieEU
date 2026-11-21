extends Node

var rain: AudioStreamPlayer
var engine: AudioStreamPlayer
var tension: AudioStreamPlayer
var effects: Dictionary
var muted := false

func _ready() -> void:
	if DisplayServer.get_name() == "headless":
		return
	rain = player(synthesize("rain",2.0,true),-20)
	engine = player(synthesize("engine",1.0,true),-21)
	tension = player(synthesize("tension",2.0,true),-42)
	for pair in [["impact",0.26],["scream",1.3],["radio",0.52],["step",0.17],["shove",0.24],["success",2.1]]:
		effects[pair[0]] = player(synthesize(pair[0],pair[1],false),-14)
	rain.play()
	engine.play()
	tension.play()

func player(clip: AudioStreamWAV, volume: float) -> AudioStreamPlayer:
	var node := AudioStreamPlayer.new()
	node.stream = clip
	node.volume_db = volume
	add_child(node)
	return node

func cue(id: String) -> void:
	if not muted and effects.has(id):
		var node: AudioStreamPlayer = effects[id]
		node.play()

func levels(speed: float, driving: bool, active: bool) -> void:
	if engine == null:
		return
	engine.pitch_scale = 0.72 + clampf(speed/25.0,0,1)*1.10
	engine.volume_db = -65 if muted else (-23 + speed*0.29 if driving else -39)
	rain.volume_db = -75 if muted else (-23 if driving else -17)
	tension.volume_db = -75 if muted else (-24 if active else -48)

func synthesize(kind: String, seconds: float, repeat: bool) -> AudioStreamWAV:
	const RATE := 22050
	var clip := AudioStreamWAV.new()
	var pcm := PackedByteArray()
	var sample_count := int(RATE*seconds)
	pcm.resize(sample_count*2)
	var rng := RandomNumberGenerator.new()
	rng.seed = 75918
	var low := 0.0
	for i in range(sample_count):
		var t := float(i)/RATE
		var p := t/seconds
		var noise := rng.randf_range(-1,1)
		low = lerpf(low,noise,0.059)
		var value := 0.0
		match kind:
			"rain":
				value = low*0.88 + noise*0.15 + sin(TAU*28*t)*0.03
			"engine":
				value = (sin(TAU*42*t)*0.42+sin(TAU*84*t)*0.21+sin(TAU*126*t)*0.1)* (0.83+sin(TAU*8*t)*0.17)+low*0.18
			"tension":
				value = sin(TAU*48*t)*0.26+sin(TAU*66*t)*0.15+sin(TAU*72.5*t)*0.17
			"impact", "shove", "step":
				var gain := 0.30 if kind == "step" else (0.54 if kind == "shove" else 0.93)
				value = (sin(TAU*(62*t-19*t*t))*0.38+low*0.64+noise*0.13)*exp(-p*6)*gain
			"scream":
				var phase := TAU*(430*t+92*t*t)+sin(TAU*23*t)*0.6
				value = (sin(phase)*0.27+sin(phase*1.47)*0.18+noise*0.10)*pow(sin(PI*p),0.67)
			"radio":
				value = (sin(TAU*(685 if p < 0.43 else 516)*t)*0.18+noise*0.26)*exp(-p*2.7)
			"success":
				value = (sin(TAU*130.5*t)*0.18+sin(TAU*196*t)*0.11+sin(TAU*261*t)*0.06)*sin(PI*p)
		if not repeat:
			value *= minf(1.0,p*130)
		pcm.encode_s16(i*2,int(clampf(value,-1,1)*32766))
	clip.format = AudioStreamWAV.FORMAT_16_BITS
	clip.mix_rate = RATE
	clip.data = pcm
	if repeat:
		clip.loop_mode = AudioStreamWAV.LOOP_FORWARD
		clip.loop_end = sample_count
	return clip
