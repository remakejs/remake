// ------ overrides ------

Node.prototype._appendChild = Node.prototype.appendChild;
Node.prototype.appendChild = function () {
	delete this.__keys;
	this._appendChild(...arguments);
}
Node.prototype._insertBefore = Node.prototype.insertBefore;
Node.prototype.insertBefore = function () {
	delete this.__keys;
	this._insertBefore(...arguments);
}
Node.prototype._removeChild = Node.prototype.removeChild;
Node.prototype.removeChild = function () {
	delete this.__keys;
	this._removeChild(...arguments);
}
Node.prototype._replaceChild = Node.prototype.replaceChild;
Node.prototype.replaceChild = function () {
	delete this.__keys;
	this._replaceChild(...arguments);
}

Element.prototype._after = Element.prototype.after;
Element.prototype.after = function () {
	delete this.parentNode.__keys;
	this._after(...arguments);
}
Element.prototype._append = Element.prototype.append;
Element.prototype.append = function () {
	delete this.__keys;
	this._append(...arguments);
}
Element.prototype._before = Element.prototype.before;
Element.prototype.before = function () {
	delete this.parentNode.__keys;
	this._before(...arguments);
}
Element.prototype._prepend = Element.prototype.prepend;
Element.prototype.prepend = function () {
	delete this.__keys;
	this._prepend(...arguments);
}
Element.prototype._remove = Element.prototype.remove;
Element.prototype.remove = function () {
	delete this.parentNode.__keys;
	this._remove(...arguments);
}
Element.prototype._replaceChildren = Element.prototype.replaceChildren;
Element.prototype.replaceChildren = function () {
	delete this.__keys;
	this._replaceChildren(...arguments);
}
Element.prototype._replaceWith = Element.prototype.replaceWith;
Element.prototype.replaceWith = function () {
	delete this.parentNode.__keys;
	this._replaceWith(...arguments);
}

// ------ implementation ------

let t = 1;
let willPrune = false;
let debugOpts = {};
const prunes = new Set();

function prune() {
	for (const elem of prunes) {
		pruneElement(elem);
	}

	willPrune = false;
	prunes.clear();
	t++;
}

function pruneElement(elem) {
	if (debugOpts.countMoves) {
		if (elem.tagName === "UL") {
			console.log(`${elem.getAttribute("key")}: ${elem.__moveCount || 0} moved, ${elem.__stayCount || 0} stayed`);
		}
		elem.__moveCount = 0;
		elem.__stayCount = 0;
	}

	let child = elem.firstElementChild;
	while (child != null) {
		if (isRemade(child)) {
			// remade element will survive
			child = child.nextElementSibling;
			continue;
		}

		if (!child.hasAttribute("key")) {
			// unkeyed element will survive
			child = child.nextElementSibling;
			continue;
		}

		// remove outdated element
		const next = child.nextElementSibling;
		elem._removeChild(child);
		child = next;
	}

	child = elem.firstElementChild;
	while (child != null) {
		if (child.hasAttribute("key")) {
			pruneElement(child); // recursive pruning
		}
		child = child.nextElementSibling;
	}
}

function isRemade(elem) { return elem.__t === t; }

function isCursorEnabled(elem) { return elem.__tCursor === t; }

function remakeCommon(parent, child) {
	// mark as remade
	child.__t = t;

	// reset cursor
	if (child.__tCursor !== t) {
		child.__tCursor = t;
		child.__cursor = child.firstElementChild;
	}

	// schedule pruning
	if (!willPrune) {
		willPrune = true;
		queueMicrotask(prune);
	}

	// prune descendants
	if (!isRemade(parent)) {
		prunes.add(child);
	}
}

function remakeSelf(elem) {
	remakeCommon(elem.parentNode, elem);
}

function remakeJSX(parent, { type, props, children }) {
	if (typeof type === 'function') {
		type({ parent, children, ...props });
		return;
	}

	// create element with tag name and key
	const elem = remakeElement(parent, type, props.key);
	if (props.ref != null) { props.ref.current = elem;}
	if (props.refs != null) { props.refs[elem.getAttribute("key")] = elem; }

	// set props and children
	setProps(elem, props);
	for (const child of children) {
		setChild(elem, child);
	}

	return elem;
}

const IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;

function setStyle(style, key, value) {
	if (key[0] === '-') {
		style.setProperty(key, value == null ? '' : value);
	} else if (value == null) {
		style[key] = '';
	} else if (typeof value != 'number' || IS_NON_DIMENSIONAL.__test(key)) {
		style[key] = value;
	} else {
		style[key] = value + 'px';
	}
}

function setProps(elem, props) {
	if (elem._listened == null) {
		elem._listened = new Set();
	}

	for (const key in props) {
		if (key === "key" || key === "ref" || key === "refs") {
			continue;
		}

		const value = props[key];
		if (key === "style") {
			const style = elem.style;
			if (typeof value === "string") {
				style.cssText = value;
			} else {
				for (const key in value) {
					setStyle(style, key, value[key]);
				}
			}
		} else if (key.startsWith("on")) {
			const event = key.slice(2).toLowerCase();
			if (!elem._listened.has(event)) {
				elem.addEventListener(event, value);
			}
			elem._listened.add(event);
		} else if (key in elem) {
			elem[key] = value;
		} else if (value == null) {
			elem.removeAttribute(key);
		} else {
			elem.setAttribute(key, value);
		}
	}
}

function setChild(elem, child) {
	if (child == null) {

	} else if (typeof child === 'string') {
		remakeText(elem, child);
	} else if (child.__remakejs) {
		remakeJSX(elem, child);
	} else if (Array.isArray(child)) {
		for (const c of child) {
			setChild(elem, c);
		}
	} else {
		remakeText(elem, child.toString());
	}
}

function remakeElement(parent, tagName, key) {
	// collect keys of server-rendered children
	if (parent.__keys == null) {
		parent.__keys = {};
		let child = parent.firstElementChild;
		while (child != null) {
			const key = child.getAttribute("key");
			if (key != null) {
				parent.__keys[key] = child;
			}
			child = child.nextElementSibling;
		}
	}

	// auto key generation
	if (key == null) {
		if (parent.__tTagCounts !== t) {
			parent.__tTagCounts = t;
			parent.__tagCounts = {};
		}

		const tagCount = parent.__tagCounts[tagName] || 0;
		key = `auto ${tagName} ${tagCount}`;
		parent.__tagCounts[tagName] = tagCount + 1;

	} else if (typeof key !== "string") {
		key = key.toString();
	}

	// return existing child
	if (key in parent.__keys) {
		const child = parent.__keys[key];
		remakeCommon(parent, child);

		if (isCursorEnabled(parent)) {
			let next = parent.__cursor == null ? null : parent.__cursor.nextElementSibling;
			if (next === child) { next = next.nextElementSibling; }

			// insert child before the cursor
			if (parent.__cursor !== child) {
				parent._insertBefore(child, parent.__cursor);
				if (debugOpts.countMoves) {
					parent.__moveCount ||= 0;
					parent.__moveCount++;
				}
			} else if (debugOpts.countMoves) {
				parent.__stayCount ||= 0;
				parent.__stayCount++;
			}

			parent.__cursor = next;
		}

		return child;
	}

	// create new child
	const child = document.createElement(tagName);
	child.setAttribute("key", key);
	parent.__keys[key] = child;
	remakeCommon(parent, child);

	if (isCursorEnabled(parent)) {
		// insert child before the cursor
		parent._insertBefore(child, parent.__cursor);
	} else {
		parent._appendChild(child);
	}

	return child;
}

function remakeText(parent, text) {
	if (parent.__tTextCount !== t) {
		parent.__tTextCount = t;
		parent.__textCount = 0;
	}
	const span = remakeElement(parent, "span", `text ${parent.__textCount}`);
	span.textContent = text;
	parent.__textCount++;
	return span;
}

// ------ public API ------

export const remake = function(parent) {
	if (arguments.length === 1) {
		remakeSelf(parent);
		return;
	}
	if (typeof arguments[1] === 'object' && arguments[1].__remakejs) {
		return remakeJSX(parent, arguments[1]);
	}
	return remakeElement(...arguments);
};

remake.text = (parent, text) => {
	return remakeText(parent, text);
};

export const React = {
	createElement: (type, props, ...children) => {
		return { __remakejs: true, type, props: props || {}, children };
	},
	Fragment: ({ parent, children }) => {
		for (const child of children) {
			setChild(parent, child);
		}
	},
};

export function debug(opts) {
	debugOpts = opts;
}
