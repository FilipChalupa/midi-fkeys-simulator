import { execFileSync } from 'child_process'
import easymidi from 'easymidi'
import { exit } from 'process'

const inputs = easymidi.getInputs()
if (inputs.length === 0) {
	console.error('No MIDI input found.')
	exit(0)
}
const inputName = inputs.at(0)
console.log(`Using ${inputName} as input.`)

const input = new easymidi.Input(inputName)
input.on('noteon', (message) => {
	if (message.note >= 36 && message.note <= 43 && message.channel === 0) {
		const index = message.note - 36
		const now = new Date()
		const key = `f${13 + index}`
		console.log(
			`[${now.toLocaleTimeString('en', {
				hour12: false,
			})}] Simulate ${key} press.`,
		)
		execFileSync('nircmd.exe', ['sendkeypress', key])
	}
})
