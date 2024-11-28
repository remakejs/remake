export type Remake = {
	(self: Element): void,
	(parent: Element, tagName: string, key?: any): any,
	(parent: Element, velem: VTagElement): any,
	(parent: Element, velem: VComponentElement): void,
	text: (parent: Element, text: string) => HTMLSpanElement,
}

export const remake: Remake;

export declare function debug(opts: {
	countMoves?: boolean,
}): void;

// JSX API
export type VText = string | number | boolean | bigint | null | undefined;

export type VTagElement = {
	__remakejs: true,
	type: string,
}

export type VComponentElement = {
	__remakejs: true,
	type: Component<any>,
}

export type VElement = VTagElement | VComponentElement;

export type VNode = VElement | VText | VNode[];

export type Component<P extends { parent: Element, children: VNode[] }> = (props: P) => void;

export type Key = string | number | any;

// export type Ref<E extends Element> = { current: E | null };
export type Ref = { current: any | null };

// export type Refs<K extends keyof JSX.IntrinsicElements> 
// 	Record<string, Element> & { [key in K]: JSX.IntrinsicElements[K] extends JSX.HTMLAttributes<infer E> ? E : never };
export type Refs = Record<string, any>;

// export type Attributes<E extends Element, T = ''> = JSX.HTMLAttributes<E> & { key?: Key, ref?: Ref<E>, refs?: Refs<T> };

export type Props = Record<string, any> & { key?: Key, ref?: Ref, refs?: Refs };

export type createElement = {
	<P extends Props>(
		type: string,
		props: P,
		...children: VNode[]
	): VTagElement,

	<P extends Props>(
		type: Component<P & { parent: Element, children: VNode[] }>,
		props: P,
		...children: VNode[]
	): VComponentElement,
}

export declare const React: {
	createElement: createElement,
	Fragment: Component<any>,
}
