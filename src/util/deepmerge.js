export const deepMerge = (base, override) => {
    const copy = {...base};
    for (const key of Object.keys(override)) {
        if (override[key] instanceof Object) {
            if (!Array.isArray(override[key]) || base[key] === undefined) {
                copy[key] = deepMerge(base[key], override[key]);
            } else {
                copy[key] = override[key]; // No merge!
            }
        } else {
            copy[key] = override[key];
        }
    }
    return copy;
}
