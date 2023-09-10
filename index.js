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
const noteIndexesWithStat = [0, 1]

input.on('noteon', (message) => {
	const index = message.note - notesOffset
	if (index >= 0 && index <= 7 && message.channel === 0) {
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

const loop = () => {
	for (const [index, isOn] of notesOn.entries()) {
		output.send(isOn ? 'noteon' : 'noteoff', {
			note: index,
			velocity: 127,
			channel: 0,
		})
	}
	setTimeout(loop, 100)
}
loop()
