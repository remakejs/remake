import { remake, React } from '@remakejs/remake';

function Counter(p: { parent: Element }) {
	const root = remake(p.parent, 'div') as any;
	root.count ||= 0;
	const incr = () => { root.count++; Counter(p); };
	remake(root,
		<>
			<button onClick={incr}>Increment</button>
			<div>Count is {root.count}</div>
		</>
	);
}

Counter({ parent: document.body });
