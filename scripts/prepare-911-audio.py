"""Build continuous engine beds from the credited 911 recording.
Usage: python3 scripts/prepare-911-audio.py /path/to/decoded-44100-mono.wav
"""
import sys, wave
from pathlib import Path
import numpy as np

with wave.open(sys.argv[1]) as recording:
    rate = recording.getframerate()
    assert recording.getnchannels() == 1 and recording.getsampwidth() == 2
    source = np.frombuffer(recording.readframes(recording.getnframes()), '<i2').astype(float) / 32768

def sustain(x, seconds, steady=False):
    # Preserve the recorded spectrum while spreading its changing envelope over a longer bed.
    n, hop = 2048, 256
    window = np.hanning(n)
    padded = np.pad(x, (n, n))
    spectrum = np.stack([np.fft.rfft(padded[i:i+n] * window) for i in range(0, len(padded)-n, hop)], axis=1)
    steps = np.linspace(2, spectrum.shape[1]-3, round(seconds*rate/hop))
    if steady:
        # Hold one recorded engine spectrum so the sample cannot imitate another gear change.
        steps[:] = spectrum.shape[1] // 2
    phase = np.angle(spectrum[:, int(steps[0])])
    advance = 2*np.pi*hop*np.arange(n//2+1)/n
    output = np.zeros(len(steps)*hop+n)
    weight = np.zeros_like(output)
    for frame, step in enumerate(steps):
        index = int(step); fraction = step-index
        magnitude = (1-fraction)*abs(spectrum[:, index])+fraction*abs(spectrum[:, index+1])
        delta = np.angle(spectrum[:, index+1])-np.angle(spectrum[:, index])-advance
        delta -= 2*np.pi*np.round(delta/(2*np.pi))
        y = np.fft.irfft(magnitude*np.exp(1j*phase))*window
        start = frame*hop
        output[start:start+n] += y
        weight[start:start+n] += window**2
        phase += advance+delta
    output /= np.maximum(weight, .001)
    return output[n:-n]

def level(x):
    # Remove the repeated loudness ramp without compressing individual engine pulses.
    points = np.arange(0, len(x), round(rate*.08))
    rms = np.array([np.sqrt(np.mean(x[max(0,p-round(rate*.12)):min(len(x),p+round(rate*.12))]**2)) for p in points])
    envelope = np.interp(np.arange(len(x)), points, rms)
    return x * np.clip(.14/np.maximum(envelope,.003), .2, 12)

def write(name, x, looping):
    x = x-x.mean()
    if looping:
        x = level(x)
        overlap = round(rate*.65)
        fade = np.linspace(0, 1, overlap)
        joint = x[-overlap:]*(1-fade)+x[:overlap]*fade
        x = np.concatenate([x[overlap:-overlap], joint])
        # Match amplitude and first derivative at the wrap after crossfading the texture.
        count = round(rate*.012)
        correction = x[0]-x[-1]
        x[-count:] += correction*np.linspace(0,1,count)**2
    else:
        fade = round(rate*.025)
        x[:fade] *= np.linspace(0,1,fade)
        x[-fade:] *= np.linspace(1,0,fade)
    x *= min(.17/np.sqrt(np.mean(x*x)), .8/np.max(abs(x)))
    pcm = (x*32767).astype('<i2')
    path = Path('public/audio/forest-drive') / f'{name}.wav'
    with wave.open(str(path),'wb') as output:
        output.setnchannels(1); output.setsampwidth(2); output.setframerate(rate); output.writeframes(pcm.tobytes())
    print(name, f'{len(x)/rate:.2f}s', 'seam', int(pcm[0])-int(pcm[-1]), 'peak', round(float(max(abs(x))),3))

write('911-idle', source[round(4.0*rate):round(8.8*rate)].copy(), True)
write('911-pull', sustain(source[round(33.6*rate):round(35.15*rate)], 10), True)
write('911-blip', source[round(9.0*rate):round(10.55*rate)].copy(), False)

write('911-redline', sustain(source[round(33.6*rate):round(35.15*rate)], 6, steady=True), True)
