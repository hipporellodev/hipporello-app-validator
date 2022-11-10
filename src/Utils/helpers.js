const startsWithOneOf = (text, options) => {
    if (Array.isArray(options)) {
        return options.some(option => {
            return text.startsWith(option);
        })
    }
    return text?.startsWith(options)
}

const includesOneOf = (text, options) => {
    if (Array.isArray(options)) {
        return options.some(option => {
            return text.includes(option);
        })
    }
    return text?.startsWith(options)
}
export {
    startsWithOneOf,
    includesOneOf
}