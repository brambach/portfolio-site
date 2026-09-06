"""Render an original, quiet electric-piano loop for the car radio. No sampled recordings."""
from pathlib import Path
import wave
import numpy as np

rate = 22050
seconds = 24
track = np.zeros(rate * seconds)

def note(midi, start, duration, level):
    count = int(duration * rate)
    t = np.arange(count) / rate
    hz = 440 * 2 ** ((midi - 69) / 12)
    tone = np.sin(2 * np.pi * hz * t) + .2 * np.sin(2 * np.pi * hz * 2 * t) * np.exp(-t * 2)
    envelope = (1 - np.exp(-t * 55)) * np.exp(-t * 1.3)
    envelope *= np.minimum(1, (duration - t) / .3)
    indices = (int(start * rate) + np.arange(count)) % len(track)
    np.add.at(track, indices, tone * envelope * level)

chords = [[50, 62, 66, 69, 73], [47, 59, 62, 66, 69], [43, 55, 59, 62, 66], [45, 57, 61, 64, 71]]
for bar, chord in enumerate(chords):
    for voice, midi in enumerate(chord):
        note(midi, bar * 6 + voice * .07, 5.5, .11 if voice == 0 else .055)
    for offset, voice in [(2.25, 3), (3.75, 4), (5.25, 2)]:
        note(chord[voice], bar * 6 + offset, 2.5, .045)

# Circular echoes preserve the tail across the repeat boundary.
track += .19 * np.roll(track, int(rate * .375)) + .09 * np.roll(track, int(rate * .75))
track -= track.mean()
track *= min(.075 / np.sqrt(np.mean(track ** 2)), .48 / np.max(abs(track)))
# A short boundary correction removes any remaining sample discontinuity.
count = int(rate * .012)
track[-count:] += (track[0] - track[-1]) * np.linspace(0, 1, count) ** 2
path = Path('public/audio/forest-drive/lake-radio.wav')
with wave.open(str(path), 'wb') as output:
    output.setnchannels(1)
    output.setsampwidth(2)
    output.setframerate(rate)
    output.writeframes((track * 32767).astype('<i2').tobytes())
print(f'{path}: {seconds} seconds, {path.stat().st_size} bytes')
