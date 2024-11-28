// @vitest-environment happy-dom

import { remake, React } from '@remakejs/remake';
import { test, expect } from 'vitest';

async function moment() {
	return new Promise(resolve => setTimeout(resolve, 1));
}

test.for([
	['div',
		<div key={0}></div>,
		'<div key="0"></div>'
	],
	['div (auto key)',
		<div></div>,
		'<div key="auto div 0"></div>'
	],
	['nested',
		<div><span></span><span><i></i></span></div>,
		'<div key="auto div 0"><span key="auto span 0"></span><span key="auto span 1"><i key="auto i 0"></i></span></div>'
	],
	['attributes',
		<a href="https://example.com" key={0}></a>,
		'<a key="0" href="https://example.com"></a>'
	],
	['fragment: empty',
		<></>,
		''
	],
	['fragment: text',
		<>hello, world!</>,
		'<span key="text 0">hello, world!</span>'
	],
	['fragment: div',
		<><div key={0}></div></>,
		'<div key="0"></div>'
	],
	['fragment: divs',
		<><div key={0}></div><div key={1}></div></>,
		'<div key="0"></div><div key="1"></div>'
	],
	['fragment: mixed',
		<><div key={0}>hello, </div> world!</>,
		'<div key="0"><span key="text 0">hello, </span></div><span key="text 0"> world!</span>'
	],
])('%s', async ([name, velem, want]) => {

	const root = remake(document.body, 'div', name);

	remake(root, velem);
	await moment();

	remake(root, velem);
	await moment();

	expect(root.innerHTML).toBe(want);
})
