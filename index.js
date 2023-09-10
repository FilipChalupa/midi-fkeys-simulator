import { execFileSync } from 'child_process'
import easymidi from 'easymidi'
import { exit } from 'process'

const inputs = easymidi.getInputs()
const outputs = easymidi.getOutputs()

const input = (() => {
	const inputName = inputs.at(0)
	if (inputName === undefined) {
		console.error('No MIDI input found.')
		exit(0)
	}

	return new easymidi.Input(inputName)
})()
console.log(`Using ${input.name} as input.`)

const output = (() => {
	const isWithOutput = outputs.some((output) => output === input.name)
	if (isWithOutput) {
		return new easymidi.Output(input.name)
	}
	return null
})()

const notesOn = new Map()
const notesOffset = 36
const noteIndexes = [0, 1, 2, 3, 4, 5, 6, 7]
const noteIndexesWithStat = [0, 1]

input.on('noteon', (message) => {
	const index = message.note - notesOffset
	if (noteIndexes.includes(index) && message.channel === 0) {
		const now = new Date()
		const key = `f${13 + index}`
		console.log(
			`[${now.toLocaleTimeString('en', {
				hour12: false,
			})}] Simulate ${key.toUpperCase()} key press.`,
		)
		execFileSync('nircmd.exe', ['sendkeypress', key])
		if (noteIndexesWithStat.includes(index)) {
			const newValue = !(notesOn.get(message.note) ?? false)
			notesOn.set(message.note, newValue)
			console.log(
				`Setting key ${key.toUpperCase()} to ${newValue ? 'on' : 'off'}.`,
			)
		}
	}
})

const turnOnOff = (note, isOn) => {
	output.send(isOn ? 'noteon' : 'noteoff', {
		note: note,
		velocity: 127,
		channel: 0,
	})
}

const loop = () => {
	for (const [note, isOn] of notesOn.entries()) {
		turnOnOff(note, isOn)
	}
	setTimeout(loop, 100)
}
loop()

const animate = () => {
	noteIndexes.forEach((index) => {
		const note = index + notesOffset
		turnOnOff(note, false)
		setTimeout(() => {
			turnOnOff(note, true)
			setTimeout(() => {
				turnOnOff(note, false)
			}, 300)
		}, index * 50 + 300)
	})
}
animate()
setTimeout(animate, 1000)
