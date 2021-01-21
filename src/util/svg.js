import { setAttribute } from './dom';

function setFontSize(text, size) {
    setAttribute(text, 'font-size', size);
}

export function adaptTextSize(text, maxFontSize, fitSize) {
    if(text.getComputedTextLength() <= fitSize) {
        return text;
    }

    let lower = 0, upper = maxFontSize;
    const maxIterations = 6;
    for(let i = 0; i < maxIterations; i++) {
        const mid = (lower + upper) / 2;
        setFontSize(text, mid);
        if(text.getComputedTextLength() <= fitSize) {
            lower = mid;
        } else {
            upper = mid;
        }
    }
    setFontSize(text, lower);

    return text;
}
