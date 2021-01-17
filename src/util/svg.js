import { setAttribute } from './dom';

function setFontSize(text, size) {
    setAttribute(text, 'font-size', size);
}

// Not yet working
export function adaptTextSize(text, maxFontSize, fitSize) {
    if(text.getComputedTextLength() <= fitSize) {
        return text;
    }

    let lower = 1, upper = maxFontSize;
    const maxIterations = 10;
    for(let i = 0; i < maxIterations; i++) {
        const mid = (lower + upper) / 2;
        setFontSize(text, mid);
        if(text.getComputedTextLength() <= fitSize) {
            upper = mid;
        } else {
            lower = mid;
        }
    }
    setFontSize(text, lower);

    return text;
}
