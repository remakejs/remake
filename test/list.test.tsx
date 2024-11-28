// @vitest-environment happy-dom

import { remake, React, debug } from '@remakejs/remake';
import { test, expect } from 'vitest';

debug({ countMoves: true });

async function moment() {
	return new Promise(resolve => setTimeout(resolve, 1));
}

test.each([
	['empty', []],
	['swap', [9, 2, 3, 4, 5, 6, 7, 8, 1]],
	['swap(2)', [1, 8, 3, 4, 5, 6, 7, 2, 9]],
	['remove 5th', [1, 2, 3, 4, 7, 8, 9]],
	['remove head', [4, 5, 6, 7, 8, 9]],
	['remove tail', [1, 2, 3, 4, 5]],
	['remove middle', [1, 2, 3, 7, 8, 9]],
	['keep middle', [3, 4, 5, 6]],
	['insert head', [10, 1, 2, 3, 4, 5, 6, 7, 8, 9]],
	['insert tail', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]],
	['insert middle', [1, 2, 3, 4, 5, 10, 6, 7, 8, 9]],
	['insert many', [10, 11, 1, 2, 3, 4, 5, 12, 13, 6, 7, 8, 9, 14, 15]],
	['renewal', [11, 12, 13, 14, 15, 16, 17, 18, 19]],
])('%s', async (name, values) => {

	const ul = remake(document.body, <ul key={name}></ul>);
	for (let i = 1; i < 10; i++) {
		const li = remake(ul, <li key={i}>value is {i}</li>);
		li.state = 1;
	}
	await moment();

	remake(ul);
	for (let i of values) {
		const li = remake(ul, <li key={i}>value is {i}</li>);
		li.state++;
	}
	await moment();

	// remake again
	remake(ul);
	for (let i of values) {
		const li = remake(ul, <li key={i}>value is {i}</li>);
		li.state++;
	}
	await moment();

	// test
	console.log(ul.textContent);
	const first = values[0];
	const last = values[values.length - 1];
	expect(ul.firstChild).toBe(ul.querySelector(`li[key="${first}"])`));
	expect(ul.lastChild).toBe(ul.querySelector(`li[key="${last}"])`));

	for (let i of values) {
		const li = ul.querySelector(`li[key="${i}"]`);
		expect(li).not.toBeNull();
		expect(li?.textContent).toBe(`value is ${i}`);
		if (i < 10) {
			expect(li?.state).toBe(3);
		}
	}
})
