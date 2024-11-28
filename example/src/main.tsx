import { remake, React } from '@remakejs/remake';

function Counter(p: { parent: Element & { count: number } }) {
	p.parent.count ||= 0;
	const incr = () => { p.parent.count++; Counter(p); };
	remake(p.parent,
		<>
			<button onClick={incr}>Increment</button>
			<div>Count is {p.parent.count}</div>
		</>
	);
}

Counter({ parent: document.body as any });
