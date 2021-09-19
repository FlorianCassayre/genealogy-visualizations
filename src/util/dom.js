const NS = 'http://www.w3.org/2000/svg';
const NS_XLINK = 'http://www.w3.org/1999/xlink';

export function setAttribute(element, key, value) {
    element.setAttributeNS(null, key, value);
    return element;
}

export function setAttributes(element, attributes) {
    Object.entries(attributes).forEach(([key, value]) => element.setAttributeNS(null, key, value));
    return element;
}

export function createElement(tag, attributes) {
    const element = document.createElementNS(NS, tag);
    setAttributes(element, attributes);
    return element;
}

export function createSVG(attributes) {
    const svg = document.createElementNS(NS, 'svg');
    setAttributes(svg, attributes);
    svg.setAttribute('xmlns', NS); // Important
    svg.setAttribute('xmlns:xlink', NS_XLINK);
    return svg;
}
