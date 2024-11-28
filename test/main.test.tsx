// @vitest-environment happy-dom

import { remake, React } from '@remakejs/remake';
import { test, expect } from 'vitest';

async function moment() {
	return new Promise(resolve => setTimeout(resolve, 1));
}

test('state', async () => {
	const root = remake(document.body, <div key="state"></div>);
	let div = remake(root, <div key="0">state <span>this will be removed</span></div>);
	div.state = 1;
	await moment();
	div = remake(root, <div key="0">state</div>);
	div.state++;
	await moment();

	const found = root.querySelector('div');
	expect(found?.outerHTML).toBe('<div key="0"><span key="text 0">state</span></div>');
	expect(found?.state).toBe(2);
})

test('event', async () => {
	const root = remake(document.body, <div key="event"></div>);
	let clicks = 0;
	let hovers = 0;
	const handleClick = () => (clicks++);
	const handleHover = () => (hovers++);

	remake(root,
		<div onClick={handleClick} onMouseOver={handleHover}>click me</div>
	);
	await moment();

	const btn = remake(root,
		<div onClick={handleClick} onMouseOver={handleHover}>click me</div>
	);
	await moment();

	const click = new MouseEvent('click');
	const hover = new MouseEvent('mouseover');
	btn.dispatchEvent(click);
	btn.dispatchEvent(click);
	btn.dispatchEvent(hover);
	btn.dispatchEvent(hover);

	expect(btn.textContent).toBe('click me');
	expect(clicks).toBe(2);
	expect(hovers).toBe(2);
});

test('keep unkeyed elements', async () => {
	const root = remake(document.body, <div key="unkeyed"></div>);
	root.appendChild(document.createTextNode('hello, '));
	const span = document.createElement('span');
	span.textContent = 'world!';
	root.appendChild(span);
	await moment();

	remake(root);
	await moment();
	remake(root);
	await moment();

	expect(root.innerHTML).toBe('hello, <span>world!</span>');
})

test('unkeyed > keyed', async () => {
	const root = remake(document.body, <div key="unkeyed keyed"></div>);
	root.appendChild(document.createTextNode('hello, '));
	const span = document.createElement('span');
	span.textContent = 'world!';
	root.appendChild(span);
	remake(span, <div key="0"></div>);
	await moment();

	remake(root);
	await moment();
	remake(root);
	await moment();

	expect(root.innerHTML).toBe('hello, <span>world!<div key="0"></div></span>');

	remake(span);
	await moment();
	remake(span);
	await moment();

	expect(root.innerHTML).toBe('hello, <span>world!</span>');
})

test('ref', async () => {
	const root = remake(document.body, <div key="ref"></div>);
	const refs = {} as Record<string, any>;
	const ref = {} as { current: any };
	remake(root,
		<div ref={ref} key="0" id="0">
			<div refs={refs} key="1" id="1"></div>
			<div refs={refs} key="2" id="2"></div>
		</div>
	);

	expect(ref.current.id).toBe('0');
	expect(refs['1'].id).toBe('1');
	expect(refs['2'].id).toBe('2');
})
